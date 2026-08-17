import WeatherRepository from '../repositories/weather.repository';
import WeatherForecastRepository from '../repositories/weather-forecast.repository';
import WeatherHistoryRepository from '../repositories/weather-history.repository';
import { getCache, setCache } from '../config/redis.config';
import { NotFoundError } from '../utils/errors';
import { logger } from '../config/logger.config';

export class WeatherService {
  private weatherRepo: WeatherRepository;
  private forecastRepo: WeatherForecastRepository;
  private historyRepo: WeatherHistoryRepository;

  constructor(
    weatherRepo = new WeatherRepository(),
    forecastRepo = new WeatherForecastRepository(),
    historyRepo = new WeatherHistoryRepository()
  ) {
    this.weatherRepo = weatherRepo;
    this.forecastRepo = forecastRepo;
    this.historyRepo = historyRepo;
  }

  private convertToImperial(weather: any): any {
    const data = { ...weather };
    if (data.temp !== undefined) {
      data.temp = Number((data.temp * 1.8 + 32).toFixed(1));
    }
    if (data.feelsLike !== undefined && data.feelsLike !== null) {
      data.feelsLike = Number((data.feelsLike * 1.8 + 32).toFixed(1));
    }
    if (data.windSpeed !== undefined && data.windSpeed !== null) {
      data.windSpeed = Number((data.windSpeed * 0.621371).toFixed(1)); // km/h to mph
    }
    return data;
  }

  async getCurrentWeather(lat: number, lon: number, units = 'metric', lang = 'en'): Promise<any> {
    const cacheKey = `weather:current:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}:${lang}`;
    
    // Check Cache-aside
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for: ${cacheKey}`);
      return cached;
    }

    // Query Database
    const weather = await this.weatherRepo.findNearCoordinates(lat, lon);
    if (!weather) {
      throw new NotFoundError('No weather record found near these coordinates.');
    }

    let result = {
      latitude: Number(weather.latitude),
      longitude: Number(weather.longitude),
      temp: Number(weather.temp),
      feelsLike: weather.feelsLike ? Number(weather.feelsLike) : null,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed ? Number(weather.windSpeed) : null,
      windDirection: weather.windDirection,
      pressure: weather.pressure,
      uvIndex: weather.uvIndex ? Number(weather.uvIndex) : null,
      rainProbability: weather.rainProbability,
      conditionCode: weather.conditionCode,
      condition: weather.condition,
      timestamp: weather.timestamp,
    };

    if (units === 'imperial') {
      result = this.convertToImperial(result);
    }

    // Cache-aside writeback (5 minutes TTL)
    await setCache(cacheKey, result, 300);
    return result;
  }

  async getHourlyForecast(lat: number, lon: number, units = 'metric', lang = 'en'): Promise<any[]> {
    const cacheKey = `weather:forecast:hourly:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}:${lang}`;
    
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for: ${cacheKey}`);
      return cached;
    }

    const forecasts = await this.forecastRepo.findForecasts(lat, lon, 'hourly');
    
    let result = forecasts.map((f) => ({
      id: f.id,
      latitude: Number(f.latitude),
      longitude: Number(f.longitude),
      forecastTime: f.forecastTime,
      temp: Number(f.temp),
      rainChance: f.rainChance,
      condition: f.condition,
      icon: f.icon,
    }));

    if (units === 'imperial') {
      result = result.map((f) => this.convertToImperial(f));
    }

    // Cache-aside writeback (10 minutes TTL)
    await setCache(cacheKey, result, 600);
    return result;
  }

  async getDailyForecast(lat: number, lon: number, units = 'metric', lang = 'en'): Promise<any[]> {
    const cacheKey = `weather:forecast:daily:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}:${lang}`;
    
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for: ${cacheKey}`);
      return cached;
    }

    const forecasts = await this.forecastRepo.findForecasts(lat, lon, 'daily');
    
    let result = forecasts.map((f) => ({
      id: f.id,
      latitude: Number(f.latitude),
      longitude: Number(f.longitude),
      forecastTime: f.forecastTime,
      temp: Number(f.temp),
      rainChance: f.rainChance,
      condition: f.condition,
      icon: f.icon,
    }));

    if (units === 'imperial') {
      result = result.map((f) => this.convertToImperial(f));
    }

    // Cache-aside writeback (10 minutes TTL)
    await setCache(cacheKey, result, 600);
    return result;
  }

  async getWeatherHistory(lat: number, lon: number, startDate: Date, endDate: Date): Promise<any[]> {
    const history = await this.historyRepo.findHistory(lat, lon, startDate, endDate);
    return history.map((h) => ({
      id: h.id,
      latitude: Number(h.latitude),
      longitude: Number(h.longitude),
      recordedAt: h.recordedAt,
      temp: Number(h.temp),
      humidity: h.humidity,
      windSpeed: h.windSpeed ? Number(h.windSpeed) : null,
      condition: h.condition,
    }));
  }

  async getWeatherSummary(lat: number, lon: number, lang = 'en'): Promise<any> {
    const cacheKey = `weather:summary:${lat.toFixed(2)}:${lon.toFixed(2)}:${lang}`;
    
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const current = await this.getCurrentWeather(lat, lon, 'metric', lang);
    const forecasts = await this.getDailyForecast(lat, lon, 'metric', lang);

    const nextForecast = forecasts[0];
    let summaryText = `Current weather is ${current.condition || 'Clear'} with a temperature of ${current.temp}°C and humidity at ${current.humidity}%.`;
    if (nextForecast) {
      summaryText += ` Upcoming forecast on ${new Date(nextForecast.forecastTime).toLocaleDateString()} shows ${nextForecast.condition} with a temp of ${nextForecast.temp}°C.`;
    }

    const result = {
      latitude: lat,
      longitude: lon,
      summary: summaryText,
      conditionCode: current.conditionCode,
      generatedAt: new Date(),
    };

    // Cache for 30 minutes
    await setCache(cacheKey, result, 1800);
    return result;
  }
}

export default WeatherService;
