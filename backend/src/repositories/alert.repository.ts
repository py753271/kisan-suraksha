import { Alert } from '@prisma/client';
import BaseRepository from './base.repository';
import db from '../config/database.config';

export class AlertRepository extends BaseRepository<Alert> {
  constructor() {
    super('alert');
  }

  async findFiltered(filters: {
    category?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    skip: number;
    take: number;
  }): Promise<{ alerts: any[]; total: number }> {
    const where: any = { deletedAt: null };

    if (filters.category) {
      where.category = { name: filters.category };
    }
    if (filters.severity) {
      where.severity = { name: filters.severity };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.startDate || filters.endDate) {
      where.effectiveTime = {};
      if (filters.startDate) {
        where.effectiveTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.effectiveTime.lte = filters.endDate;
      }
    }

    const [alerts, total] = await Promise.all([
      this.model.findMany({
        where,
        include: {
          category: true,
          severity: true,
        },
        orderBy: { effectiveTime: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.model.count({ where }),
    ]);

    return { alerts, total };
  }

  async findDetailById(id: string): Promise<any | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        category: true,
        severity: true,
      },
    });
  }

  // Spatial PostGIS Proximity radius query (raw SQL)
  async findLiveNearby(lon: number, lat: number, radiusMeters: number): Promise<any[]> {
    return db.$queryRaw`
      SELECT a.id, a.title, a.description, a.status, a.instructions,
             a."effectiveTime", a."expiryTime", a."affectedArea",
             c.name as "category", s.name as "severity"
      FROM "Alert" a
      JOIN "AlertCategory" c ON a."categoryId" = c.id
      JOIN "AlertSeverity" s ON a."severityId" = s.id
      WHERE a.status = 'Active'
        AND a."expiryTime" > NOW()
        AND a."deletedAt" IS NULL
        AND ST_DWithin(
          ST_SetSRID(ST_GeomFromGeoJSON(a."affectedArea"::text), 4326)::geography,
          ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY a."effectiveTime" DESC;
    `;
  }

  // Spatial PostGIS Bounding Box query (raw SQL)
  async findLiveInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number): Promise<any[]> {
    return db.$queryRaw`
      SELECT a.id, a.title, a.description, a.status, a.instructions,
             a."effectiveTime", a."expiryTime", a."affectedArea",
             c.name as "category", s.name as "severity"
      FROM "Alert" a
      JOIN "AlertCategory" c ON a."categoryId" = c.id
      JOIN "AlertSeverity" s ON a."severityId" = s.id
      WHERE a.status = 'Active'
        AND a."expiryTime" > NOW()
        AND a."deletedAt" IS NULL
        AND ST_Intersects(
          ST_SetSRID(ST_GeomFromGeoJSON(a."affectedArea"::text), 4326),
          ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326)
        )
      ORDER BY a."effectiveTime" DESC;
    `;
  }

  async findHistory(alertId: string): Promise<any[]> {
    return db.alertHistory.findMany({
      where: { alertId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAlertStats(): Promise<any> {
    const [bySeverity, byCategory] = await Promise.all([
      db.alert.groupBy({
        by: ['severityId'],
        _count: { id: true },
        where: {
          status: 'Active',
          expiryTime: { gte: new Date() },
          deletedAt: null,
        },
      }),
      db.alert.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        where: {
          status: 'Active',
          expiryTime: { gte: new Date() },
          deletedAt: null,
        },
      }),
    ]);

    return { bySeverity, byCategory };
  }
}

export default AlertRepository;
