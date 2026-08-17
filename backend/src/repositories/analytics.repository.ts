import { AnalyticsSnapshot } from '@prisma/client';
import BaseRepository from './base.repository';

export class AnalyticsRepository extends BaseRepository<AnalyticsSnapshot> {
  constructor() {
    super('analyticsSnapshot');
  }

  async findByMetric(name: string, limit = 50): Promise<AnalyticsSnapshot[]> {
    return this.model.findMany({
      where: { metricName: name, deletedAt: null },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export default AnalyticsRepository;
