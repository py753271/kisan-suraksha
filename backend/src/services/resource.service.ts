import EmergencyResourceRepository from '../repositories/emergency-resource.repository';
import { getCache, setCache } from '../config/redis.config';
import { logger } from '../config/logger.config';

export class ResourceService {
  private resourceRepo: EmergencyResourceRepository;

  constructor(resourceRepo = new EmergencyResourceRepository()) {
    this.resourceRepo = resourceRepo;
  }

  async getNearbyResources(lon: number, lat: number, limit = 5): Promise<any[]> {
    const cacheKey = `emergency:resources:nearest:${lon.toFixed(3)}:${lat.toFixed(3)}:${limit}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for emergency resources: ${cacheKey}`);
      return cached;
    }

    const resources = await this.resourceRepo.findLiveNearby(lon, lat, limit);

    // Cache resources check for 1 minute (60 seconds)
    await setCache(cacheKey, resources, 60);
    return resources;
  }
}

export default ResourceService;
