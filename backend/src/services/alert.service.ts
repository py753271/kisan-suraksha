import AlertRepository from '../repositories/alert.repository';
import { getCache, setCache, invalidateByPattern, delCache } from '../config/redis.config';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class AlertService {
  private alertRepo: AlertRepository;

  constructor(alertRepo = new AlertRepository()) {
    this.alertRepo = alertRepo;
  }

  // Validate GeoJSON Polygon structures
  private validateGeoJSON(geo: any): void {
    if (!geo || typeof geo !== 'object') {
      throw new ValidationError('GeoJSON must be a valid JSON object.');
    }
    if (geo.type !== 'Polygon' && geo.type !== 'MultiPolygon') {
      throw new ValidationError('Alert affected area must be a Polygon or MultiPolygon GeoJSON.');
    }
    if (!Array.isArray(geo.coordinates)) {
      throw new ValidationError('GeoJSON is missing coordinates array.');
    }
  }

  async getAlerts(filters: any): Promise<any> {
    const cacheKey = `alerts:list:${JSON.stringify(filters)}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (filters.page - 1) * filters.limit;
    const { alerts, total } = await this.alertRepo.findFiltered({
      category: filters.category,
      severity: filters.severity,
      status: filters.status,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      skip,
      take: filters.limit,
    });

    const result = {
      alerts: alerts.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        status: a.status,
        effectiveTime: a.effectiveTime,
        expiryTime: a.expiryTime,
        category: a.category.name,
        severity: a.severity.name,
        affectedRegions: a.affectedRegions,
      })),
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };

    // Cache list queries for 1 minute
    await setCache(cacheKey, result, 60);
    return result;
  }

  async getLiveAlerts(spatialParams: any): Promise<any[]> {
    const isBBox =
      spatialParams.minLon !== undefined &&
      spatialParams.minLat !== undefined &&
      spatialParams.maxLon !== undefined &&
      spatialParams.maxLat !== undefined;

    const cacheKey = isBBox
      ? `alerts:live:bbox:${spatialParams.minLon}:${spatialParams.minLat}:${spatialParams.maxLon}:${spatialParams.maxLat}`
      : `alerts:live:nearby:${spatialParams.lon}:${spatialParams.lat}:${spatialParams.radius}`;

    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let alerts: any[] = [];
    if (isBBox) {
      alerts = await this.alertRepo.findLiveInBoundingBox(
        Number(spatialParams.minLon),
        Number(spatialParams.minLat),
        Number(spatialParams.maxLon),
        Number(spatialParams.maxLat)
      );
    } else {
      alerts = await this.alertRepo.findLiveNearby(
        Number(spatialParams.lon),
        Number(spatialParams.lat),
        Number(spatialParams.radius)
      );
    }

    // Cache active alerts query for 30 seconds
    await setCache(cacheKey, alerts, 30);
    return alerts;
  }

  async getAlertById(id: string): Promise<any> {
    const cacheKey = `alerts:detail:${id}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const alert = await this.alertRepo.findDetailById(id);
    if (!alert) {
      throw new NotFoundError('Alert not found.');
    }

    const result = {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      instructions: alert.instructions,
      status: alert.status,
      effectiveTime: alert.effectiveTime,
      expiryTime: alert.expiryTime,
      category: alert.category.name,
      severity: alert.severity.name,
      affectedArea: alert.affectedArea,
      affectedRegions: alert.affectedRegions,
    };

    // Cache detail for 5 minutes
    await setCache(cacheKey, result, 300);
    return result;
  }

  async getAlertHistory(id: string): Promise<any[]> {
    // Assert alert exists
    const alertExists = await this.alertRepo.findById(id);
    if (!alertExists) {
      throw new NotFoundError('Alert not found.');
    }

    const histories = await this.alertRepo.findHistory(id);
    return histories.map((h) => ({
      id: h.id,
      action: h.action,
      reason: h.reason,
      performedBy: h.performedBy,
      timestamp: h.timestamp,
    }));
  }

  async getSummary(): Promise<any> {
    const cacheKey = 'alerts:summary:counts';
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.alertRepo.getAlertStats();
    
    // Fetch categories and severities names maps
    const [categories, severities] = await Promise.all([
      db.alertCategory.findMany(),
      db.alertSeverity.findMany(),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const sevMap = new Map(severities.map((s) => [s.id, s.name]));

    const severityCounts: Record<string, number> = {};
    for (const stat of stats.bySeverity) {
      const name = sevMap.get(stat.severityId) || 'Unknown';
      severityCounts[name] = stat._count.id;
    }

    const categoryCounts: Record<string, number> = {};
    for (const stat of stats.byCategory) {
      const name = catMap.get(stat.categoryId) || 'Unknown';
      categoryCounts[name] = stat._count.id;
    }

    const result = {
      activeAlertsCount: stats.bySeverity.reduce((acc: number, cur: any) => acc + cur._count.id, 0),
      bySeverity: severityCounts,
      byCategory: categoryCounts,
      generatedAt: new Date(),
    };

    // Cache counts for 5 minutes
    await setCache(cacheKey, result, 300);
    return result;
  }

  // Create alert with deduplication and lifecycle scheduling
  async createAlert(data: any, createdBy = 'System'): Promise<any> {
    // Validate GeoJSON
    this.validateGeoJSON(data.affectedArea);

    // Deduplication check: check if identical alert title/categoryId is active in database
    const duplicates = await db.alert.findFirst({
      where: {
        title: data.title,
        categoryId: data.categoryId,
        status: 'Active',
        expiryTime: { gte: new Date() },
        deletedAt: null,
      },
    });
    if (duplicates) {
      throw new ConflictError('A identical active alert is already published.');
    }

    // Schedule status check
    const now = new Date();
    const effective = new Date(data.effectiveTime);
    const status = effective > now ? 'Scheduled' : 'Active';

    // Insert within transactional scope
    const alert = await db.$transaction(async (tx: any) => {
      const record = await tx.alert.create({
        data: {
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          categoryId: data.categoryId,
          severityId: data.severityId,
          sourceId: data.sourceId || null,
          status,
          effectiveTime: effective,
          expiryTime: new Date(data.expiryTime),
          affectedArea: data.affectedArea,
          affectedRegions: data.affectedRegions || {},
          createdBy,
        },
      });

      // Write History logs
      await tx.alertHistory.create({
        data: {
          alertId: record.id,
          action: 'Created',
          performedBy: createdBy,
          reason: 'Initial alert creation publication',
          createdBy,
        },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'ALERT_CREATED',
          tableName: 'alert',
          recordId: record.id,
          createdBy,
        },
      });

      return record;
    });

    // Invalidate alert list patterns & summaries in Redis cache
    await invalidateByPattern('alerts:list:*');
    await delCache('alerts:summary:counts');

    // Trigger Notification Event Hook (Stub/emitter)
    logger.info(`🚨 ALERT PUBLISHED EVENT: Event emitted for Alert ID ${alert.id}`);

    return alert;
  }

  // Cancel Alert Status Lifecycle
  async cancelAlert(id: string, reason: string, performedBy = 'System'): Promise<void> {
    const alert = await this.alertRepo.findById(id);
    if (!alert) {
      throw new NotFoundError('Alert not found.');
    }

    await db.$transaction(async (tx: any) => {
      await tx.alert.update({
        where: { id },
        data: {
          status: 'Cancelled',
          version: { increment: 1 },
          updatedBy: performedBy,
        },
      });

      await tx.alertHistory.create({
        data: {
          alertId: id,
          action: 'Cancelled',
          performedBy,
          reason,
          createdBy: performedBy,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'ALERT_CANCELLED',
          tableName: 'alert',
          recordId: id,
          createdBy: performedBy,
        },
      });
    });

    // Invalidate caches
    await invalidateByPattern('alerts:list:*');
    await delCache(`alerts:detail:${id}`);
    await delCache('alerts:summary:counts');
    logger.warn(`Alert ID ${id} cancelled. reason: ${reason}`);
  }
}

export default AlertService;
