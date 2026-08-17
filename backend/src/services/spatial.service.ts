import ShelterRepository from '../repositories/shelter.repository';
import BoundaryRepository from '../repositories/boundary.repository';
import { getCache, setCache } from '../config/redis.config';
import { logger } from '../config/logger.config';
import { NotFoundError } from '../utils/errors';

export class SpatialService {
  private shelterRepo: ShelterRepository;
  private boundaryRepo: BoundaryRepository;

  constructor(
    shelterRepo = new ShelterRepository(),
    boundaryRepo = new BoundaryRepository()
  ) {
    this.shelterRepo = shelterRepo;
    this.boundaryRepo = boundaryRepo;
  }

  async getNearestShelters(lon: number, lat: number, limit = 5): Promise<any[]> {
    const cacheKey = `map:shelters:nearest:${lon.toFixed(3)}:${lat.toFixed(3)}:${limit}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for nearest shelters: ${cacheKey}`);
      return cached;
    }

    const shelters = await this.shelterRepo.findNearestShelters(lon, lat, limit);

    // Cache proximity results for 1 minute (60 seconds)
    await setCache(cacheKey, shelters, 60);
    return shelters;
  }

  async reverseGeocode(lon: number, lat: number): Promise<any> {
    const cacheKey = `map:reverse:${lon.toFixed(4)}:${lat.toFixed(4)}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for reverse geocoding: ${cacheKey}`);
      return cached;
    }

    const boundary = await this.boundaryRepo.findBoundaryByPoint(lon, lat);
    if (!boundary) {
      throw new NotFoundError('No administrative boundary found containing these coordinates.');
    }

    // Cache reverse geocode matches for 1 hour (3600 seconds)
    await setCache(cacheKey, boundary, 3600);
    return boundary;
  }
}

export default SpatialService;
