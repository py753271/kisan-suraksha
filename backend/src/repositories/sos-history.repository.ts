import { SOSHistory } from '@prisma/client';
import BaseRepository from './base.repository';

export class SOSHistoryRepository extends BaseRepository<SOSHistory> {
  constructor() {
    super('sosHistory');
  }

  async findByRequestId(sosRequestId: string): Promise<SOSHistory[]> {
    return this.model.findMany({
      where: { sosRequestId },
      orderBy: { timestamp: 'asc' },
    });
  }
}

export default SOSHistoryRepository;
