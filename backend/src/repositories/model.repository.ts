import { PredictionModel } from '@prisma/client';
import BaseRepository from './base.repository';

export class ModelRepository extends BaseRepository<PredictionModel> {
  constructor() {
    super('predictionModel');
  }

  async findActiveByType(type: string): Promise<PredictionModel | null> {
    return this.model.findFirst({
      where: { type, isActive: true, deletedAt: null },
    });
  }
}

export default ModelRepository;
