import { CropAdvisory } from '@prisma/client';
import BaseRepository from './base.repository';

export class CropAdvisoryRepository extends BaseRepository<CropAdvisory> {
  constructor() {
    super('cropAdvisory');
  }

  async findAdvisories(cropId?: string, stage?: string, season?: string): Promise<CropAdvisory[]> {
    const where: any = { deletedAt: null };
    if (cropId) {
      where.cropId = cropId;
    }
    if (stage) {
      where.stage = stage;
    }
    if (season) {
      where.season = season;
    }

    return this.model.findMany({
      where,
      include: {
        crop: true,
      },
    });
  }
}

export default CropAdvisoryRepository;
