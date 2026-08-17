import { Report } from '@prisma/client';
import BaseRepository from './base.repository';

export class ReportRepository extends BaseRepository<Report> {
  constructor() {
    super('report');
  }

  async findLatestReports(limit = 10): Promise<Report[]> {
    return this.model.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default ReportRepository;
