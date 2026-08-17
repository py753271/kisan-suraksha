import GovernmentSourceRepository from '../repositories/government-source.repository';
import APISyncLogRepository from '../repositories/api-sync-log.repository';
import IntegrationRepository from '../repositories/integration.repository';
import IMDService from './imd.service';
import NDMAService from './ndma.service';
import CWCService from './cwc.service';
import MappingService from './mapping.service';
import ValidationService from './validation.service';
import { getCache, setCache, delCache } from '../config/redis.config';
import { logger } from '../config/logger.config';
import { ValidationError, ConflictError } from '../utils/errors';
import db from '../config/database.config';

export class SyncService {
  private sourceRepo: GovernmentSourceRepository;
  private logRepo: APISyncLogRepository;
  private integrationRepo: IntegrationRepository;
  private imd: IMDService;
  private ndma: NDMAService;
  private cwc: CWCService;
  private mapping: MappingService;
  private validation: ValidationService;

  private memoryLocks = new Set<string>();

  constructor(
    sourceRepo = new GovernmentSourceRepository(),
    logRepo = new APISyncLogRepository(),
    integrationRepo = new IntegrationRepository(),
    imd = new IMDService(),
    ndma = new NDMAService(),
    cwc = new CWCService(),
    mapping = new MappingService(),
    validation = new ValidationService()
  ) {
    this.sourceRepo = sourceRepo;
    this.logRepo = logRepo;
    this.integrationRepo = integrationRepo;
    this.imd = imd;
    this.ndma = ndma;
    this.cwc = cwc;
    this.mapping = mapping;
    this.validation = validation;
  }

  async syncProvider(provider: string, triggerBy = 'System'): Promise<any> {
    const lockKey = `sync:lock:${provider}`;

    // 1. Prevent concurrent sync executions using local + Redis locking
    const isLockedMem = this.memoryLocks.has(lockKey);
    let isLockedRedis = false;
    try {
      isLockedRedis = (await getCache<boolean>(lockKey)) || false;
    } catch (_err) {
      logger.warn('Redis unavailable during sync locking check. Using memory locks.');
    }

    if (isLockedMem || isLockedRedis) {
      throw new ConflictError(`Synchronization job is already actively running for provider: ${provider}`);
    }

    // Acquire locks
    this.memoryLocks.add(lockKey);
    try {
      await setCache(lockKey, true, 300); // 5 minutes TTL lock
    } catch (_err) {
      logger.warn('Failed setting Redis sync lock.');
    }

    // 2. Fetch provider source
    const source = await this.sourceRepo.findByName(provider);
    if (!source) {
      this.memoryLocks.delete(lockKey);
      try { await delCache(lockKey); } catch (_err) { /* ignore */ }
      throw new ValidationError(`Government data sync provider source '${provider}' is not registered in system.`);
    }

    const startedAt = new Date();
    let recordsSynced = 0;
    let errorLog: string | null = null;
    let status = 'SUCCESS';

    // 3. Initiate log entry
    const syncLog = await db.governmentSyncLog.create({
      data: {
        sourceId: source.id,
        status: 'RUNNING',
        recordsSynced: 0,
        startedAt,
        completedAt: startedAt, // placeholder
        createdBy: triggerBy,
      },
    });

    try {
      const startMs = Date.now();
      let rawData: any = null;

      // 4. API Fetch matching provider
      if (provider === 'IMD') {
        rawData = await this.imd.fetchData();
      } else if (provider === 'NDMA') {
        rawData = await this.ndma.fetchData();
      } else if (provider === 'CWC') {
        rawData = await this.cwc.fetchData();
      } else {
        // Fallback placeholder mock response
        rawData = { alerts: [], timestamp: new Date().toISOString() };
      }

      const latencyMs = Date.now() - startMs;
      logger.info(`Received API response from ${provider} in ${latencyMs}ms`);

      // 5. Schema Validation
      this.validation.validateResponse(rawData, provider);

      // 6. Map and idempotent save to databases
      await db.$transaction(async (tx: any) => {
        // Save ProviderHealth statistics
        await tx.providerHealth.create({
          data: {
            sourceId: source.id,
            isHealthy: true,
            latencyMs,
            createdBy: 'System',
          },
        });

        // Parse and save target models
        if (provider === 'IMD') {
          const mappedWeather = this.mapping.mapIMDWeather(rawData);
          // Insert dynamic weather log record
          await tx.weather.create({
            data: {
              ...mappedWeather,
              latitude: 22.3, // default center coordinates
              longitude: 70.7,
              sourceId: source.id,
              createdBy: 'System',
            },
          });
          recordsSynced = 1;
        } else if (provider === 'NDMA' || provider === 'CWC') {
          // Alert Categories lookup fallbacks
          let alertCat = await tx.alertCategory.findFirst({ where: { deletedAt: null } });
          if (!alertCat) {
            alertCat = await tx.alertCategory.create({
              data: { name: 'Meteorological', description: 'Weather warning alerts', createdBy: 'System' },
            });
          }

          let alertSev = await tx.alertSeverity.findFirst({ where: { deletedAt: null } });
          if (!alertSev) {
            alertSev = await tx.alertSeverity.create({
              data: { name: 'Severe', colorCode: '#FF0000', createdBy: 'System' },
            });
          }

          for (const rawAlert of rawData.alerts) {
            const mappedAlert = this.mapping.mapNDMAAlert(rawAlert);

            // Idempotent upsert based on title matches to prevent duplicates
            const existing = await tx.alert.findFirst({
              where: {
                title: mappedAlert.title,
                status: 'Active',
                deletedAt: null,
              },
            });

            if (!existing) {
              await tx.alert.create({
                data: {
                  ...mappedAlert,
                  categoryId: alertCat.id,
                  severityId: alertSev.id,
                  sourceId: source.id,
                  createdBy: 'System',
                },
              });
              recordsSynced++;
            }
          }
        }

        // 7. Save raw backup copy to ExternalDataset
        let dataset = await tx.externalDataset.findFirst({
          where: { name: `${provider}_RAW`, sourceId: source.id, deletedAt: null },
        });

        if (!dataset) {
          dataset = await tx.externalDataset.create({
            data: {
              name: `${provider}_RAW`,
              sourceId: source.id,
              payload: rawData,
              createdBy: 'System',
            },
          });
        } else {
          dataset = await tx.externalDataset.update({
            where: { id: dataset.id },
            data: {
              payload: rawData,
              version: { increment: 1 },
              updatedBy: 'System',
            },
          });
        }

        // Increment DatasetVersion
        await tx.datasetVersion.create({
          data: {
            datasetId: dataset.id,
            payload: rawData,
            hash: String(Date.now()), // unique signature
            createdBy: 'System',
          },
        });
      });

      // Update source status to healthy
      await db.governmentSource.update({
        where: { id: source.id },
        data: { status: 'HEALTHY', lastSyncAt: new Date() },
      });
    } catch (err: any) {
      status = 'FAILED';
      errorLog = err.message || 'Unknown integration error';
      logger.error(`[Sync Service] Provider ${provider} sync execution failed: ${errorLog}`);

      // Log failure event
      try {
        await db.syncFailureLog.create({
          data: {
            sourceId: source.id,
            errorType: 'SYNC_RUN_FAILURE',
            errorMessage: errorLog || 'Unknown error',
            createdBy: 'System',
          },
        });

        // Update provider health check to unhealthy
        await db.providerHealth.create({
          data: {
            sourceId: source.id,
            isHealthy: false,
            latencyMs: 0,
            createdBy: 'System',
          },
        });

        await db.governmentSource.update({
          where: { id: source.id },
          data: { status: 'UNHEALTHY' },
        });
      } catch (logErr) {
        logger.error('Failed registering provider health failure log:', logErr);
      }
    } finally {
      // 8. Update sync log status completion
      const completedAt = new Date();
      await db.governmentSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status,
          recordsSynced,
          errorMessage: errorLog,
          completedAt,
        },
      });

      // Clear lock keys
      this.memoryLocks.delete(lockKey);
      try {
        await delCache(lockKey);
      } catch (_err) { /* ignore */ }

      // Invalidate provider status and dashboard statistics caches
      try {
        await delCache('integrations:providers');
        await delCache('integrations:status');
        await delCache('integrations:health');
      } catch (_err) { /* ignore */ }
    }

    return {
      syncId: syncLog.id,
      provider,
      status,
      recordsSynced,
      errorMessage: errorLog,
      startedAt,
      completedAt: new Date(),
    };
  }
}

export default SyncService;
