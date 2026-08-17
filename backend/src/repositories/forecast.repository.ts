import db from '../config/database.config';

export class ForecastRepository {
  async getLatestForecasts(lat: number, lon: number): Promise<any[]> {
    return db.weatherForecast.findMany({
      where: {
        latitude: lat,
        longitude: lon,
        deletedAt: null,
      },
      orderBy: { forecastTime: 'asc' },
      take: 10,
    });
  }
}

export default ForecastRepository;
