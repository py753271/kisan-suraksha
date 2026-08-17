import SnapshotRepository from '../repositories/snapshot.repository';
import AggregationService from './aggregation.service';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class SnapshotService {
  private snapshotRepo: SnapshotRepository;
  private aggregation: AggregationService;

  constructor(
    snapshotRepo = new SnapshotRepository(),
    aggregation = new AggregationService()
  ) {
    this.snapshotRepo = snapshotRepo;
    this.aggregation = aggregation;
  }

  async generateSnapshot(type: string): Promise<any> {
    logger.info(`Generating dashboard snapshot for category: ${type}`);
    let data: any = {};

    switch (type) {
      case 'OVERVIEW':
        data = await this.aggregation.aggregateAlerts(); // fallback basic data
        break;
      case 'WEATHER':
        data = await this.aggregation.aggregateWeather();
        break;
      case 'ALERTS':
        data = await this.aggregation.aggregateAlerts();
        break;
      case 'GIS':
        data = await this.aggregation.aggregateGIS();
        break;
      case 'CROPS':
        data = await this.aggregation.aggregateCrops();
        break;
      case 'EMERGENCY':
        data = await this.aggregation.aggregateEmergency();
        break;
      case 'NOTIFICATIONS':
        data = await this.aggregation.aggregateNotifications();
        break;
      case 'INTEGRATIONS':
        data = await this.aggregation.aggregateIntegrations();
        break;
      default:
        data = { timestamp: new Date() };
    }

    // Save in DB
    const snapshot = await db.dashboardSnapshot.create({
      data: {
        type,
        data,
        createdBy: 'System',
      },
    });

    return snapshot;
  }

  async getLatestSnapshot(type: string): Promise<any> {
    const record = await this.snapshotRepo.findByType(type);
    if (!record) {
      // Fallback generate immediately
      return this.generateSnapshot(type);
    }
    return record;
  }
}

export default SnapshotService;
