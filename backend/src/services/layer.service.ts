import MapRepository from '../repositories/map.repository';
import { getCache, setCache } from '../config/redis.config';
import { NotFoundError } from '../utils/errors';
import { logger } from '../config/logger.config';

export class LayerService {
  private mapRepo: MapRepository;

  constructor(mapRepo = new MapRepository()) {
    this.mapRepo = mapRepo;
  }

  async getLayer(layerName: string): Promise<any> {
    const cacheKey = `map:layer:${layerName}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for layer: ${layerName}`);
      return cached;
    }

    const layer = await this.mapRepo.findByName(layerName);
    if (!layer) {
      throw new NotFoundError(`GIS map layer '${layerName}' not found.`);
    }

    const result = {
      id: layer.id,
      name: layer.name,
      type: layer.type,
      geojson: layer.geojson,
      updatedAt: layer.updatedAt,
    };

    // Cache layer for 10 minutes (600 seconds)
    await setCache(cacheKey, result, 600);
    return result;
  }
}

export default LayerService;
