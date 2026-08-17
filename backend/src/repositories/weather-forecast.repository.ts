import { WeatherForecast } from '@prisma/client';
import BaseRepository from './base.repository';

export class WeatherForecastRepository extends BaseRepository<WeatherForecast> {
  constructor() {
    super('weatherForecast');
  }

  async findForecasts(lat: number, lon: number, type: string, tolerance = 0.01): Promise<WeatherForecast[]> {
    return this.model.findMany({
      where: {
        latitude: { gte: lat - tolerance, lte: lat + tolerance },
        longitude: { gte: lon - tolerance, lte: lon + tolerance },
        forecastType: type,
        forecastTime: { gte: new Date() },
      },
      orderBy: { forecastTime: 'asc' },
    });
  }
}

export default WeatherForecastRepository;
