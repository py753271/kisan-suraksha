import ForecastRepository from '../repositories/forecast.repository';

export class ForecastService {
  private forecastRepo: ForecastRepository;

  constructor(forecastRepo = new ForecastRepository()) {
    this.forecastRepo = forecastRepo;
  }

  async getObservedVsPredicted(lat: number, lon: number): Promise<any[]> {
    const list = await this.forecastRepo.getLatestForecasts(lat, lon);
    return list.map((f) => ({
      forecastTime: f.forecastTime,
      observedCondition: f.condition,
      observedTemp: Number(f.temp),
      predictedTemp: Number(f.temp) + (Math.random() > 0.5 ? 1.2 : -1.0), // Mocked model predicted range
    }));
  }
}

export default ForecastService;
