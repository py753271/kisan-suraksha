import GovernmentSourceRepository from '../repositories/government-source.repository';
import APISyncLogRepository from '../repositories/api-sync-log.repository';
import SyncService from './sync.service';
import { getCache, setCache } from '../config/redis.config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class IntegrationService {
  private sourceRepo: GovernmentSourceRepository;
  private logRepo: APISyncLogRepository;
  private syncService: SyncService;

  constructor(
    sourceRepo = new GovernmentSourceRepository(),
    logRepo = new APISyncLogRepository(),
    syncService = new SyncService()
  ) {
    this.sourceRepo = sourceRepo;
    this.logRepo = logRepo;
    this.syncService = syncService;
  }

  async getProviders(): Promise<any[]> {
    const cacheKey = 'integrations:providers';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const sources = await this.sourceRepo.findMany({ where: { deletedAt: null } });
    const formatted = sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      syncFrequency: s.syncFrequency,
      isActive: s.isActive,
      lastSyncAt: s.lastSyncAt,
      status: s.status,
    }));

    await setCache(cacheKey, formatted, 600);
    return formatted;
  }

  async getStatus(): Promise<any[]> {
    const cacheKey = 'integrations:status';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const logs = await this.logRepo.findLatestLogs(10);
    await setCache(cacheKey, logs, 60);
    return logs;
  }

  async getHealth(): Promise<any[]> {
    const cacheKey = 'integrations:health';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const stats = await db.providerHealth.findMany({
      include: { source: true },
      orderBy: { lastCheckedAt: 'desc' },
      take: 10,
    });

    await setCache(cacheKey, stats, 60);
    return stats;
  }

  async getSyncHistory(limit = 20): Promise<any[]> {
    return this.logRepo.findLatestLogs(limit);
  }

  async retrySync(syncId: string, performedBy = 'System'): Promise<any> {
    const failedLog = await this.logRepo.findById(syncId);
    if (!failedLog) {
      throw new NotFoundError('Sync execution log not found.');
    }

    if (failedLog.status !== 'FAILED') {
      throw new ValidationError('Only failed synchronization events can be retried.');
    }

    const source = await db.governmentSource.findUnique({
      where: { id: failedLog.sourceId },
    });
    if (!source) {
      throw new NotFoundError('Associated government source provider not found.');
    }

    logger.info(`Manually triggering sync retry for provider ${source.name} after failed sync ${syncId}`);
    return this.syncService.syncProvider(source.name, `Retry Trigger - ${performedBy}`);
  }
}

export default IntegrationService;
