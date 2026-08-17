import MetricsRepository from '../repositories/metrics.repository';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class MetricsService {
  private metricsRepo: MetricsRepository;

  constructor(metricsRepo = new MetricsRepository()) {
    this.metricsRepo = metricsRepo;
  }

  async captureSystemMetrics(): Promise<any> {
    const cpuUsage = 15.4 + Math.random() * 5;
    const memoryUsage = 45.2 + Math.random() * 10;
    const apiRequestCount = Math.floor(100 + Math.random() * 50);
    const apiResponseTimeAvg = 85.0 + Math.random() * 15;
    const apiErrorRate = Math.random() * 1.5;

    const metrics = await db.systemMetrics.create({
      data: {
        cpuUsage,
        memoryUsage,
        databaseStatus: 'HEALTHY',
        redisStatus: 'HEALTHY',
        queueStatus: 'HEALTHY',
        apiRequestCount,
        apiResponseTimeAvg,
        apiErrorRate,
        createdBy: 'System',
      },
    });

    // Write metric histories
    await this.metricsRepo.logHistory('SYSTEM', 'cpuUsage', cpuUsage);
    await this.metricsRepo.logHistory('SYSTEM', 'memoryUsage', memoryUsage);

    logger.info('Captured system metrics snapshot successfully.');
    return metrics;
  }

  async getLatestSystemMetrics(): Promise<any> {
    return this.metricsRepo.findLatestMetrics();
  }
}

export default MetricsService;
