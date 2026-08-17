import SOSRepository from '../repositories/sos.repository';
import SOSHistoryRepository from '../repositories/sos-history.repository';
import WeatherService from './weather.service';
import AlertService from './alert.service';
import { getCache, setCache, delCache } from '../config/redis.config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class SOSService {
  private sosRepo: SOSRepository;
  private historyRepo: SOSHistoryRepository;
  private weatherService: WeatherService;
  private alertService: AlertService;

  constructor(
    sosRepo = new SOSRepository(),
    historyRepo = new SOSHistoryRepository(),
    weatherService = new WeatherService(),
    alertService = new AlertService()
  ) {
    this.sosRepo = sosRepo;
    this.historyRepo = historyRepo;
    this.weatherService = weatherService;
    this.alertService = alertService;
  }

  async createSOS(userId: string, data: any): Promise<any> {
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);

    // 1. Fetch current weather parameters
    let temp = 28;
    try {
      const weather = await this.weatherService.getCurrentWeather(lat, lon);
      if (weather) {
        temp = weather.temp;
      }
    } catch (_err) {
      logger.warn('Weather fetch failed during SOS create context lookup. Using defaults.');
    }

    // 2. Fetch active warning overlays (15km radius check)
    let alerts: any[] = [];
    try {
      alerts = await this.alertService.getLiveAlerts({ lon, lat, radius: 15000 });
    } catch (_err) {
      logger.warn('Alerts check failed during SOS create. Proceeding.');
    }

    // 3. Dynamic priority escalation rules
    let priority = data.priority || 'Medium';
    const hasSevereWarning = alerts.some(
      (a) => a.severity.toLowerCase() === 'severe' || a.severity.toLowerCase() === 'extreme'
    );
    if (hasSevereWarning || temp > 43 || temp < 5) {
      priority = 'Critical';
      logger.warn(`🚨 Priority escalated to CRITICAL for SOS request. Weather: ${temp}°C, Active warnings: ${alerts.length}`);
    }

    // 4. Create database records in transaction
    const sosRequest = await db.$transaction(async (tx: any) => {
      const record = await tx.sOSRequest.create({
        data: {
          userId,
          latitude: lat,
          longitude: lon,
          disasterType: data.disasterType,
          priority,
          status: 'Pending',
          notes: data.notes || null,
          createdBy: userId,
        },
      });

      await tx.sOSHistory.create({
        data: {
          sosRequestId: record.id,
          status: 'Pending',
          note: `SOS Beacon emitted. Priority: ${priority}. weather temp: ${temp}C. active warnings: ${alerts.length}`,
          createdBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'SOS_EMITTED',
          tableName: 'sOSRequest',
          recordId: record.id,
          ipAddress: null,
          createdBy: userId,
        },
      });

      return record;
    });

    // Invalidate dashboard caches
    await delCache('emergency:sos:dashboard');
    logger.info(`🚨 SOS Beacon created successfully: ${sosRequest.id} for User: ${userId}`);

    return sosRequest;
  }

  async getSOSRequests(): Promise<any[]> {
    const cacheKey = 'emergency:sos:dashboard';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const requests = await this.sosRepo.findAllDetailed();
    await setCache(cacheKey, requests, 15); // Short cache of 15 seconds
    return requests;
  }

  async getSOSById(id: string): Promise<any> {
    const record = await this.sosRepo.findDetailById(id);
    if (!record) {
      throw new NotFoundError('SOS request not found.');
    }
    return record;
  }

  async getSOSHistory(id: string): Promise<any[]> {
    const check = await this.sosRepo.findById(id);
    if (!check) {
      throw new NotFoundError('SOS request not found.');
    }
    return this.historyRepo.findByRequestId(id);
  }

  async assignAgency(id: string, agency: string, notes?: string, performedBy = 'System'): Promise<any> {
    const sos = await this.sosRepo.findById(id);
    if (!sos) {
      throw new NotFoundError('SOS request not found.');
    }

    const updated = await db.$transaction(async (tx: any) => {
      const record = await tx.sOSRequest.update({
        where: { id },
        data: {
          status: 'Dispatched',
          assignedAgency: agency,
          notes: notes || sos.notes,
          version: { increment: 1 },
          updatedBy: performedBy,
        },
      });

      await tx.sOSHistory.create({
        data: {
          sosRequestId: id,
          status: 'Dispatched',
          note: `Rescue dispatched. Agency: ${agency}. notes: ${notes || 'N/A'}`,
          createdBy: performedBy,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: 'SOS_DISPATCHED',
          tableName: 'sOSRequest',
          recordId: id,
          createdBy: performedBy,
        },
      });

      return record;
    });

    await delCache('emergency:sos:dashboard');
    logger.info(`Agency '${agency}' assigned to SOS request ${id}.`);
    return updated;
  }

  async updateSOSStatus(id: string, status: string, notes?: string, performedBy = 'System'): Promise<any> {
    const sos = await this.sosRepo.findById(id);
    if (!sos) {
      throw new NotFoundError('SOS request not found.');
    }

    const allowed = ['Pending', 'Dispatched', 'Resolved', 'Cancelled'];
    if (!allowed.includes(status)) {
      throw new ValidationError(`Invalid SOS status: ${status}. Allowed: ${allowed.join(', ')}`);
    }

    const updated = await db.$transaction(async (tx: any) => {
      const record = await tx.sOSRequest.update({
        where: { id },
        data: {
          status,
          notes: notes || sos.notes,
          version: { increment: 1 },
          updatedBy: performedBy,
        },
      });

      await tx.sOSHistory.create({
        data: {
          sosRequestId: id,
          status,
          note: notes || `SOS status changed to ${status}`,
          createdBy: performedBy,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: null,
          action: `SOS_${status.toUpperCase()}`,
          tableName: 'sOSRequest',
          recordId: id,
          createdBy: performedBy,
        },
      });

      return record;
    });

    await delCache('emergency:sos:dashboard');
    logger.info(`SOS Request ${id} updated to status: ${status}.`);
    return updated;
  }
}

export default SOSService;
