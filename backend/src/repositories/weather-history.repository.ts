import { WeatherHistory } from '@prisma/client';
import BaseRepository from './base.repository';

export class WeatherHistoryRepository extends BaseRepository<WeatherHistory> {
  constructor() {
    super('weatherHistory');
  }

  async findHistory(lat: number, lon: number, startDate: Date, endDate: Date, tolerance = 0.01): Promise<WeatherHistory[]> {
    return this.model.findMany({
      where: {
        latitude: { gte: lat - tolerance, lte: lat + tolerance },
        longitude: { gte: lon - tolerance, lte: lon + tolerance },
        recordedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }
}

export default WeatherHistoryRepository;
