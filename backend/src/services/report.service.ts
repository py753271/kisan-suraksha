import ReportRepository from '../repositories/report.repository';
import AggregationService from './aggregation.service';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class ReportService {
  private reportRepo: ReportRepository;
  private aggregation: AggregationService;

  constructor(
    reportRepo = new ReportRepository(),
    aggregation = new AggregationService()
  ) {
    this.reportRepo = reportRepo;
    this.aggregation = aggregation;
  }

  async generateReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY', userId: string): Promise<any> {
    logger.info(`Generating ${type} system report...`);

    const weatherStats = await this.aggregation.aggregateWeather();
    const alertStats = await this.aggregation.aggregateAlerts();
    const emergencyStats = await this.aggregation.aggregateEmergency();

    const content = {
      generatedAt: new Date(),
      reportingInterval: type,
      weatherStats,
      alertStats,
      emergencyStats,
    };

    const report = await db.report.create({
      data: {
        title: `${type.charAt(0) + type.slice(1).toLowerCase()} Farmers Safety Advisory Report`,
        type,
        format: 'JSON',
        url: `/reports/download/${type.toLowerCase()}-${Date.now()}.json`,
        content,
        createdById: userId,
        createdBy: userId,
      },
    });

    logger.info(`Advisory report generated successfully: ${report.id}`);
    return report;
  }

  async getReportsList(limit = 10): Promise<any[]> {
    return this.reportRepo.findLatestReports(limit);
  }
}

export default ReportService;
