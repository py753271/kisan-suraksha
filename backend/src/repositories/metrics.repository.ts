import { SystemMetrics, MetricsHistory } from '@prisma/client';
import BaseRepository from './base.repository';
import db from '../config/database.config';

export class MetricsRepository extends BaseRepository<SystemMetrics> {
  constructor() {
    super('systemMetrics');
  }

  async findLatestMetrics(): Promise<SystemMetrics | null> {
    return this.model.findFirst({
      where: { deletedAt: null },
      orderBy: { timestamp: 'desc' },
    });
  }

  async logHistory(category: string, name: string, value: number): Promise<MetricsHistory> {
    return db.metricsHistory.create({
      data: {
        category,
        name,
        value,
        createdBy: 'System',
      },
    });
  }

  async findHistoryByCategory(category: string, limit = 50): Promise<MetricsHistory[]> {
    return db.metricsHistory.findMany({
      where: { category, deletedAt: null },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export default MetricsRepository;
