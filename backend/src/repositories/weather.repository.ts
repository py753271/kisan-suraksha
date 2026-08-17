import { Weather } from '@prisma/client';
import BaseRepository from './base.repository';

export class WeatherRepository extends BaseRepository<Weather> {
  constructor() {
    super('weather');
  }

  async findNearCoordinates(lat: number, lon: number, tolerance = 0.01): Promise<Weather | null> {
    return this.model.findFirst({
      where: {
        latitude: { gte: lat - tolerance, lte: lat + tolerance },
        longitude: { gte: lon - tolerance, lte: lon + tolerance },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export default WeatherRepository;
