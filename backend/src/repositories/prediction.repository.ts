import { PredictionResult } from '@prisma/client';
import BaseRepository from './base.repository';

export class PredictionRepository extends BaseRepository<PredictionResult> {
  constructor() {
    super('predictionResult');
  }

  async findByType(type: string, confThreshold = 0.70): Promise<any[]> {
    return this.model.findMany({
      where: {
        predictionType: type,
        confidenceScore: { gte: confThreshold },
        deletedAt: null,
      },
      include: {
        model: true,
      },
      orderBy: { forecastTime: 'desc' },
    });
  }

  async findAllDetailed(): Promise<any[]> {
    return this.model.findMany({
      include: {
        model: true,
      },
      orderBy: { forecastTime: 'desc' },
    });
  }
}

export default PredictionRepository;
