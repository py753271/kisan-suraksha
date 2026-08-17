import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DashboardService } from '../../src/services/dashboard.service';
import { AggregationService } from '../../src/services/aggregation.service';
import { MetricsService } from '../../src/services/metrics.service';
import { ReportService } from '../../src/services/report.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { NotFoundError } from '../../src/utils/errors';
import db from '../../src/config/database.config';

// Mock dependencies
const mockDashboardRepo = {
  getOverviewStats: jest.fn<any>(),
} as any;

const mockMetricsRepo = {
  findLatestMetrics: jest.fn<any>(),
  logHistory: jest.fn<any>(),
} as any;

const mockReportRepo = {
  findLatestReports: jest.fn<any>(),
} as any;

const mockSnapshotRepo = {} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
}));

jest.mock('../../src/config/database.config', () => {
  return {
    __esModule: true,
    default: {
      alert: { count: jest.fn<any>() },
      sOSRequest: { count: jest.fn<any>() },
      crop: { count: jest.fn<any>() },
      cropAdvisory: { count: jest.fn<any>() },
      mapLayer: { count: jest.fn<any>() },
      emergencyShelter: { count: jest.fn<any>() },
      notification: { count: jest.fn<any>() },
      governmentSyncLog: { count: jest.fn<any>() },
      providerHealth: { findMany: jest.fn<any>() },
      systemMetrics: { create: jest.fn<any>() },
      report: { create: jest.fn<any>() },
      weather: {
        count: jest.fn<any>(),
        aggregate: jest.fn<any>(),
      },
    },
    db: {
      alert: { count: jest.fn<any>() },
      sOSRequest: { count: jest.fn<any>() },
      crop: { count: jest.fn<any>() },
      cropAdvisory: { count: jest.fn<any>() },
      mapLayer: { count: jest.fn<any>() },
      emergencyShelter: { count: jest.fn<any>() },
      notification: { count: jest.fn<any>() },
      governmentSyncLog: { count: jest.fn<any>() },
      providerHealth: { findMany: jest.fn<any>() },
      systemMetrics: { create: jest.fn<any>() },
      report: { create: jest.fn<any>() },
      weather: {
        count: jest.fn<any>(),
        aggregate: jest.fn<any>(),
      },
    },
  };
});

describe('Dashboard & Analytics Module Unit Tests (Phase 11)', () => {
  let dashboardService: DashboardService;
  let aggregation: AggregationService;
  let metrics: MetricsService;
  let reports: ReportService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    aggregation = new AggregationService();
    metrics = new MetricsService(mockMetricsRepo);
    reports = new ReportService(mockReportRepo, aggregation);
    dashboardService = new DashboardService(mockDashboardRepo, aggregation, metrics);
  });

  describe('Aggregation Layer', () => {
    it('Should calculate average temperatures and record counts', async () => {
      (db.weather.count as jest.MockedFunction<any>).mockResolvedValue(10);
      (db.weather.aggregate as jest.MockedFunction<any>).mockResolvedValue({
        _avg: { temp: 29.5 },
      });

      const stats = await aggregation.aggregateWeather();
      expect(stats.recordsImportedCount).toBe(10);
      expect(stats.averageTemperature).toBe(29.5);
    });

    it('Should compile active early warning status classifications', async () => {
      (db.alert.count as jest.MockedFunction<any>).mockResolvedValue(5);

      const stats = await aggregation.aggregateAlerts();
      expect(stats.activeAlertsCount).toBe(5);
    });
  });

  describe('Dashboard caching checks', () => {
    it('Should check Redis cache and bypass repo calculations on hit', async () => {
      const mockResult = { activeAlerts: 2, pendingSOS: 1 };
      mockGet.mockResolvedValue(mockResult);

      const result = await dashboardService.getOverview();
      expect(result).toEqual(mockResult);
      expect(mockGet).toHaveBeenCalledWith('dashboard:overview');
      expect(mockDashboardRepo.getOverviewStats).not.toHaveBeenCalled();
    });

    it('Should execute calculations and write back on cache miss', async () => {
      mockGet.mockResolvedValue(null);
      mockDashboardRepo.getOverviewStats.mockResolvedValue({ activeAlerts: 3 });
      mockSet.mockResolvedValue(true);

      const result = await dashboardService.getOverview();
      expect(result.activeAlerts).toBe(3);
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('Reports and metrics generations', () => {
    it('Should compile daily HTML/JSON content on periodic report runs', async () => {
      (db.weather.count as jest.MockedFunction<any>).mockResolvedValue(10);
      (db.weather.aggregate as jest.MockedFunction<any>).mockResolvedValue({
        _avg: { temp: 29.5 },
      });
      (db.alert.count as jest.MockedFunction<any>).mockResolvedValue(2);
      (db.sOSRequest.count as jest.MockedFunction<any>).mockResolvedValue(1);

      const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 'report-1', format: 'JSON' });
      (db.report.create as any).mockImplementation(mockCreate);

      const result = await reports.generateReport('DAILY', 'user-uuid-123');
      expect(result.id).toBe('report-1');
      expect(mockCreate).toHaveBeenCalled();
    });
  });
});
