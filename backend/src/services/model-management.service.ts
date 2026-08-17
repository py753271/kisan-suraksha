import ModelRepository from '../repositories/model.repository';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class ModelManagementService {
  private modelRepo: ModelRepository;

  constructor(modelRepo = new ModelRepository()) {
    this.modelRepo = modelRepo;
  }

  async getActiveModel(type: string): Promise<any> {
    let model = await this.modelRepo.findActiveByType(type);
    if (!model) {
      // Bootstraps default AI predictor model records
      logger.info(`Bootstrapping default AI predictor model for type: ${type}`);
      model = await db.predictionModel.create({
        data: {
          name: `${type.toLowerCase().replace('_', ' ')} predictor model`,
          type,
          versionString: 'v1.0.0',
          isActive: true,
          createdBy: 'System',
        },
      });
    }
    return model;
  }
}

export default ModelManagementService;
