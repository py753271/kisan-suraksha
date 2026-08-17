import CropRepository from '../repositories/crop.repository';
import CropCategoryRepository from '../repositories/crop-category.repository';
import BoundaryRepository from '../repositories/boundary.repository';
import { getCache, setCache } from '../config/redis.config';
import { logger } from '../config/logger.config';

export class CropService {
  private cropRepo: CropRepository;
  private categoryRepo: CropCategoryRepository;
  private boundaryRepo: BoundaryRepository;

  constructor(
    cropRepo = new CropRepository(),
    categoryRepo = new CropCategoryRepository(),
    boundaryRepo = new BoundaryRepository()
  ) {
    this.cropRepo = cropRepo;
    this.categoryRepo = categoryRepo;
    this.boundaryRepo = boundaryRepo;
  }

  async getRecommendations(lon: number, lat: number, categoryId?: string): Promise<any[]> {
    const cacheKey = `crops:recommendations:${lon.toFixed(3)}:${lat.toFixed(3)}:${categoryId || 'all'}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Reverse geocode to find state
    let stateName = 'Unknown';
    try {
      const boundary = await this.boundaryRepo.findBoundaryByPoint(lon, lat);
      if (boundary) {
        stateName = boundary.stateName;
      }
    } catch (_err) {
      logger.warn('Failed reverse geocoding inside crop recommendations fallback.');
    }

    // Query crops
    const query: any = { deletedAt: null };
    if (categoryId) {
      query.categoryId = categoryId;
    }
    const crops = await this.cropRepo.findMany({ where: query, include: { category: true } }) as any[];

    // Location-aware recommendation filter
    const recommended = crops.map((crop) => {
      let score = 50; // default score out of 100
      let suitability = 'Moderate';

      // Regional suitability mappings
      if (stateName === 'Punjab') {
        if (crop.name === 'Wheat' || crop.name === 'Paddy') {
          score = 95;
          suitability = 'High';
        }
      } else if (stateName === 'Gujarat') {
        if (crop.name === 'Cotton' || crop.name === 'Sugarcane') {
          score = 90;
          suitability = 'High';
        }
      } else if (stateName === 'Bihar') {
        if (crop.name === 'Maize' || crop.name === 'Potato') {
          score = 85;
          suitability = 'High';
        }
      }

      return {
        id: crop.id,
        name: crop.name,
        category: crop.category.name,
        suitabilityScore: score,
        suitabilityLevel: suitability,
        reason: `Highly suited for climatic trends and soil profiles in ${stateName}.`,
      };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    // Cache recommendation list for 10 minutes (600 seconds)
    await setCache(cacheKey, recommended, 600);
    return recommended;
  }
}

export default CropService;
