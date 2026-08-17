import { GovernmentSyncLog } from '@prisma/client';
import BaseRepository from './base.repository';

export class APISyncLogRepository extends BaseRepository<GovernmentSyncLog> {
  constructor() {
    super('governmentSyncLog');
  }

  async findLatestLogs(limit = 20): Promise<GovernmentSyncLog[]> {
    return this.model.findMany({
      include: {
        source: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}

export default APISyncLogRepository;
