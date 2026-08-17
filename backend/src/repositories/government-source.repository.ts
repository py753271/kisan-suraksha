import { GovernmentSource } from '@prisma/client';
import BaseRepository from './base.repository';

export class GovernmentSourceRepository extends BaseRepository<GovernmentSource> {
  constructor() {
    super('governmentSource');
  }

  async findByName(name: string): Promise<GovernmentSource | null> {
    return this.model.findUnique({
      where: { name },
    });
  }
}

export default GovernmentSourceRepository;
