import DashboardRepository from '../repositories/dashboard.repository';
import AggregationService from './aggregation.service';
import MetricsService from './metrics.service';
import { getCache, setCache } from '../config/redis.config';

export class DashboardService {
  private dashboardRepo: DashboardRepository;
  private aggregation: AggregationService;
  private metrics: MetricsService;

  constructor(
    dashboardRepo = new DashboardRepository(),
    aggregation = new AggregationService(),
    metrics = new MetricsService()
  ) {
    this.dashboardRepo = dashboardRepo;
    this.aggregation = aggregation;
    this.metrics = metrics;
  }

  async getOverview(): Promise<any> {
    const cacheKey = 'dashboard:overview';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.dashboardRepo.getOverviewStats();
    await setCache(cacheKey, stats, 30);
    return stats;
  }

  async getWeatherDashboard(): Promise<any> {
    const cacheKey = 'dashboard:weather';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateWeather();
    await setCache(cacheKey, stats, 60);
    return stats;
  }

  async getAlertsDashboard(): Promise<any> {
    const cacheKey = 'dashboard:alerts';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateAlerts();
    await setCache(cacheKey, stats, 30);
    return stats;
  }

  async getGISDashboard(): Promise<any> {
    const cacheKey = 'dashboard:gis';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateGIS();
    await setCache(cacheKey, stats, 60);
    return stats;
  }

  async getCropsDashboard(): Promise<any> {
    const cacheKey = 'dashboard:crops';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateCrops();
    await setCache(cacheKey, stats, 60);
    return stats;
  }

  async getEmergencyDashboard(): Promise<any> {
    const cacheKey = 'dashboard:emergency';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateEmergency();
    await setCache(cacheKey, stats, 15);
    return stats;
  }

  async getNotificationsDashboard(): Promise<any> {
    const cacheKey = 'dashboard:notifications';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateNotifications();
    await setCache(cacheKey, stats, 60);
    return stats;
  }

  async getIntegrationsDashboard(): Promise<any> {
    const cacheKey = 'dashboard:integrations';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const stats = await this.aggregation.aggregateIntegrations();
    await setCache(cacheKey, stats, 60);
    return stats;
  }

  async getSystemDashboard(): Promise<any> {
    const cacheKey = 'dashboard:system';
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    let stats = await this.metrics.getLatestSystemMetrics();
    if (!stats) {
      stats = await this.metrics.captureSystemMetrics();
    }

    await setCache(cacheKey, stats, 10);
    return stats;
  }
}

export default DashboardService;
