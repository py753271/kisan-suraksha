import EmergencyShelterRepository from '../repositories/emergency-shelter.repository';
import { getCache, setCache, invalidateByPattern, delCache } from '../config/redis.config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class ShelterService {
  private shelterRepo: EmergencyShelterRepository;

  constructor(shelterRepo = new EmergencyShelterRepository()) {
    this.shelterRepo = shelterRepo;
  }

  async getNearestShelters(lon: number, lat: number, limit = 5): Promise<any[]> {
    const cacheKey = `emergency:shelters:nearest:${lon.toFixed(3)}:${lat.toFixed(3)}:${limit}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const shelters = await this.shelterRepo.findNearestShelters(lon, lat, limit);

    // Cache nearby shelters queries for 1 minute (60 seconds)
    await setCache(cacheKey, shelters, 60);
    return shelters;
  }

  async getSheltersList(): Promise<any[]> {
    const cacheKey = 'emergency:shelters:list';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const shelters = await this.shelterRepo.findMany({ where: { deletedAt: null } });
    await setCache(cacheKey, shelters, 300);
    return shelters;
  }

  async updateOccupancy(id: string, occupancy: number, performedBy = 'System'): Promise<any> {
    const shelter = await this.shelterRepo.findById(id);
    if (!shelter) {
      throw new NotFoundError('Emergency shelter not found.');
    }

    if (occupancy < 0) {
      throw new ValidationError('Occupancy count cannot be negative.');
    }
    if (occupancy > shelter.capacity) {
      throw new ValidationError(`Occupancy count exceeds shelter capacity limit of ${shelter.capacity}.`);
    }

    const status = occupancy === shelter.capacity ? 'Full' : 'Open';

    const updated = await db.$transaction(async (tx: any) => {
      const record = await tx.emergencyShelter.update({
        where: { id },
        data: {
          currentOccupancy: occupancy,
          status,
          version: { increment: 1 },
          updatedBy: performedBy,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'SHELTER_OCCUPANCY_CHANGED',
          tableName: 'emergencyShelter',
          recordId: id,
          newValues: { occupancy, status },
          createdBy: performedBy,
        },
      });

      return record;
    });

    // Invalidate nearest cache queries
    await invalidateByPattern('emergency:shelters:nearest:*');
    await delCache('emergency:shelters:list');
    await delCache('emergency:sos:dashboard');

    logger.info(`Emergency shelter occupancy updated: ${id} - Occupancy: ${occupancy}/${shelter.capacity}`);
    return updated;
  }
}

export default ShelterService;
