import { DashboardSnapshot } from '@prisma/client';
import BaseRepository from './base.repository';

export class SnapshotRepository extends BaseRepository<DashboardSnapshot> {
  constructor() {
    super('dashboardSnapshot');
  }

  async findByType(type: string): Promise<DashboardSnapshot | null> {
    return this.model.findFirst({
      where: { type, deletedAt: null },
      orderBy: { generatedAt: 'desc' },
    });
  }
}

export default SnapshotRepository;
