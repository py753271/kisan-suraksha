import BoundaryRepository from '../repositories/boundary.repository';
import { getCache, setCache } from '../config/redis.config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger.config';

export class MapService {
  private boundaryRepo: BoundaryRepository;

  constructor(boundaryRepo = new BoundaryRepository()) {
    this.boundaryRepo = boundaryRepo;
  }

  async getBoundary(type: string, code: string): Promise<any> {
    const cacheKey = `map:boundary:${type}:${code}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for boundary: ${cacheKey}`);
      return cached;
    }

    let result: any = null;
    switch (type) {
      case 'state':
        result = await this.boundaryRepo.findStateBoundary(code);
        break;
      case 'district':
        result = await this.boundaryRepo.findDistrictBoundary(code);
        break;
      case 'tehsil':
        result = await this.boundaryRepo.findTehsilBoundary(code);
        break;
      case 'village':
        result = await this.boundaryRepo.findVillageBoundary(code);
        break;
      default:
        throw new ValidationError(`Invalid boundary lookup type: ${type}`);
    }

    if (!result) {
      throw new NotFoundError(`${type.charAt(0).toUpperCase() + type.slice(1)} boundary with code '${code}' not found.`);
    }

    // Cache administrative bounds for 1 hour (3600 seconds)
    await setCache(cacheKey, result, 3600);
    return result;
  }
}

export default MapService;
