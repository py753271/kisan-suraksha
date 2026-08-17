import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { WeatherService } from '../../src/services/weather.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { NotFoundError } from '../../src/utils/errors';

// Deep mock repositories and cache calls
const mockWeatherRepo = {
  findNearCoordinates: jest.fn<any>(),
} as any;

const mockForecastRepo = {
  findForecasts: jest.fn<any>(),
} as any;

const mockHistoryRepo = {
  findHistory: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
}));

describe('Weather Module Unit Tests (Phase 4)', () => {
  let weatherService: WeatherService;
  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    weatherService = new WeatherService(mockWeatherRepo, mockForecastRepo, mockHistoryRepo);
  });

  describe('getCurrentWeather', () => {
    const lat = 22.30;
    const lon = 70.78;
    const dbRecord = {
      id: 'weather-uuid-1',
      latitude: 22.301,
      longitude: 70.782,
      temp: 25.5,
      feelsLike: 27.2,
      humidity: 65,
      windSpeed: 12.5,
      windDirection: 'NE',
      pressure: 1012,
      uvIndex: 5,
      rainProbability: 10,
      conditionCode: 'RAIN',
      condition: 'Patchy rain',
      timestamp: new Date(),
    };

    it('Should fetch from cache and return if cache hit occurs', async () => {
      const cachedData = { temp: 25.5, conditionCode: 'RAIN' };
      mockGet.mockResolvedValue(cachedData);

      const result = await weatherService.getCurrentWeather(lat, lon);
      
      expect(result).toEqual(cachedData);
      expect(mockGet).toHaveBeenCalled();
      expect(mockWeatherRepo.findNearCoordinates).not.toHaveBeenCalled();
    });

    it('Should fetch from database, cache result, and return if cache miss occurs', async () => {
      mockGet.mockResolvedValue(null);
      mockWeatherRepo.findNearCoordinates.mockResolvedValue(dbRecord);
      mockSet.mockResolvedValue(true);

      const result = await weatherService.getCurrentWeather(lat, lon);

      expect(result.temp).toBe(dbRecord.temp);
      expect(result.conditionCode).toBe(dbRecord.conditionCode);
      expect(mockWeatherRepo.findNearCoordinates).toHaveBeenCalledWith(lat, lon);
      expect(mockSet).toHaveBeenCalled();
    });

    it('Should convert temperature to imperial units if requested', async () => {
      mockGet.mockResolvedValue(null);
      mockWeatherRepo.findNearCoordinates.mockResolvedValue(dbRecord);
      mockSet.mockResolvedValue(true);

      const result = await weatherService.getCurrentWeather(lat, lon, 'imperial');

      // 25.5 Celsius -> 25.5 * 1.8 + 32 = 77.9 Fahrenheit
      expect(result.temp).toBe(77.9);
      // 12.5 km/h -> 12.5 * 0.621371 = 7.8 mph
      expect(result.windSpeed).toBe(7.8);
    });

    it('Should throw NotFoundError if record is missing in database', async () => {
      mockGet.mockResolvedValue(null);
      mockWeatherRepo.findNearCoordinates.mockResolvedValue(null);

      await expect(weatherService.getCurrentWeather(lat, lon)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getWeatherSummary', () => {
    it('Should compile a descriptive text summary based on current and forecast feeds', async () => {
      mockGet.mockResolvedValue(null);
      mockWeatherRepo.findNearCoordinates.mockResolvedValue({
        temp: 30,
        humidity: 60,
        conditionCode: 'CLEAR',
        condition: 'Sunny skies',
        latitude: 22.3,
        longitude: 70.7,
        timestamp: new Date(),
      });
      mockForecastRepo.findForecasts.mockResolvedValue([
        {
          forecastTime: new Date(Date.now() + 86400000),
          temp: 32,
          rainChance: 20,
          condition: 'Partly cloudy skies',
          icon: 'cloudy',
          latitude: 22.3,
          longitude: 70.7,
        },
      ]);

      const result = await weatherService.getWeatherSummary(22.3, 70.7);

      expect(result.summary).toContain('Sunny skies');
      expect(result.summary).toContain('Partly cloudy skies');
      expect(result.summary).toContain('32°C');
    });
  });
});
