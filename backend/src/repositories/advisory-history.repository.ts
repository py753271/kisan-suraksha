import { AdvisoryHistory } from '@prisma/client';
import BaseRepository from './base.repository';

export class AdvisoryHistoryRepository extends BaseRepository<AdvisoryHistory> {
  constructor() {
    super('advisoryHistory');
  }

  async findByCropId(cropId?: string, limit = 10): Promise<AdvisoryHistory[]> {
    const where: any = { deletedAt: null };
    if (cropId) {
      where.advisory = { cropId };
    }
    return this.model.findMany({
      where,
      include: {
        advisory: {
          include: {
            crop: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });
  }
}

export default AdvisoryHistoryRepository;
