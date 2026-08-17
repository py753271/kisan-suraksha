import db from '../config/database.config';

export class RiskRepository {
  async getHistoricalCropRisks(cropId: string): Promise<any[]> {
    return db.advisoryHistory.findMany({
      where: {
        advisory: { cropId },
        deletedAt: null,
      },
      orderBy: { generatedAt: 'desc' },
      take: 10,
    });
  }
}

export default RiskRepository;
