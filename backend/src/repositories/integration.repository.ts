import { ExternalDataset } from '@prisma/client';
import BaseRepository from './base.repository';

export class IntegrationRepository extends BaseRepository<ExternalDataset> {
  constructor() {
    super('externalDataset');
  }

  async findByNameAndSource(name: string, sourceId: string): Promise<ExternalDataset | null> {
    return this.model.findFirst({
      where: {
        name,
        sourceId,
        deletedAt: null,
      },
    });
  }
}

export default IntegrationRepository;
