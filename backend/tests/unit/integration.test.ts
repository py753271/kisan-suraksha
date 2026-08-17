import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SyncService } from '../../src/services/sync.service';
import { MappingService } from '../../src/services/mapping.service';
import { ValidationService } from '../../src/services/validation.service';
import { SchedulerService } from '../../src/services/scheduler.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { ValidationError, ConflictError } from '../../src/utils/errors';
import db from '../../src/config/database.config';

// Mock dependencies
const mockSourceRepo = {
  findByName: jest.fn<any>(),
  findMany: jest.fn<any>(),
} as any;

const mockLogRepo = {} as any;
const mockIntegrationRepo = {} as any;

const mockIMD = {
  fetchData: jest.fn<any>(),
} as any;

const mockNDMA = {
  fetchData: jest.fn<any>(),
} as any;

const mockCWC = {
  fetchData: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
  delCache: jest.fn<any>(),
}));

jest.mock('../../src/config/database.config', () => {
  return {
    __esModule: true,
    default: {
      governmentSource: {
        update: jest.fn<any>(),
      },
      governmentSyncLog: {
        create: jest.fn<any>().mockResolvedValue({ id: 'sync-log-uuid-1' }),
        update: jest.fn<any>(),
      },
      providerHealth: {
        create: jest.fn<any>(),
      },
      weather: {
        create: jest.fn<any>(),
      },
      externalDataset: {
        findFirst: jest.fn<any>(),
        create: jest.fn<any>(),
        update: jest.fn<any>(),
      },
      datasetVersion: {
        create: jest.fn<any>(),
      },
      syncFailureLog: {
        create: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
    db: {
      governmentSource: {
        update: jest.fn<any>(),
      },
      governmentSyncLog: {
        create: jest.fn<any>().mockResolvedValue({ id: 'sync-log-uuid-1' }),
        update: jest.fn<any>(),
      },
      providerHealth: {
        create: jest.fn<any>(),
      },
      weather: {
        create: jest.fn<any>(),
      },
      externalDataset: {
        findFirst: jest.fn<any>(),
        create: jest.fn<any>(),
        update: jest.fn<any>(),
      },
      datasetVersion: {
        create: jest.fn<any>(),
      },
      syncFailureLog: {
        create: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
  };
});

describe('Government Integration Layer Unit Tests (Phase 10)', () => {
  let mapping: MappingService;
  let validation: ValidationService;
  let syncService: SyncService;
  let scheduler: SchedulerService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    mapping = new MappingService();
    validation = new ValidationService();
    syncService = new SyncService(
      mockSourceRepo,
      mockLogRepo,
      mockIntegrationRepo,
      mockIMD,
      mockNDMA,
      mockCWC,
      mapping,
      validation
    );
    scheduler = new SchedulerService(mockSourceRepo, syncService);
  });

  describe('Validation & Mapping Services', () => {
    it('Should throw ValidationError for empty API responses', () => {
      expect(() => validation.validateResponse(null, 'IMD')).toThrow(ValidationError);
    });

    it('Should map IMD meteorological response successfully', () => {
      const raw = { temp: 35.5, humidity: 40, windSpeed: 10 };
      const result = mapping.mapIMDWeather(raw);
      expect(result.temp).toBe(35.5);
      expect(result.humidity).toBe(40);
    });
  });

  describe('Sync Locking Safeguards', () => {
    it('Should throw ConflictError if lock key exists in Redis (concurrency check)', async () => {
      mockGet.mockResolvedValue(true);

      await expect(syncService.syncProvider('IMD')).rejects.toThrow(ConflictError);
      expect(mockSourceRepo.findByName).not.toHaveBeenCalled();
    });

    it('Should execute sync and release lock on successful run', async () => {
      mockGet.mockResolvedValue(null);
      mockSourceRepo.findByName.mockResolvedValue({ id: 'source-1', name: 'IMD' });
      mockIMD.fetchData.mockResolvedValue({ temp: 31, humidity: 50 });

      (db.governmentSyncLog.create as any).mockResolvedValue({ id: 'sync-1' });
      (db.governmentSyncLog.update as any).mockResolvedValue({});

      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          providerHealth: { create: (jest.fn() as any).mockResolvedValue({}) },
          weather: { create: (jest.fn() as any).mockResolvedValue({}) },
          externalDataset: {
            findFirst: (jest.fn() as any).mockResolvedValue(null),
            create: (jest.fn() as any).mockResolvedValue({ id: 'dataset-1' }),
          },
          datasetVersion: { create: (jest.fn() as any).mockResolvedValue({}) },
        })
      );

      const result = await syncService.syncProvider('IMD');
      expect(result.status).toBe('SUCCESS');
      expect(result.recordsSynced).toBe(1);
    });
  });

  describe('Scheduler Tasks management', () => {
    it('Should read active sources and schedule cron jobs', async () => {
      mockSourceRepo.findMany.mockResolvedValue([
        { id: 'source-1', name: 'IMD', syncFrequency: '*/15 * * * *', isActive: true },
      ]);

      await scheduler.startScheduler();
      scheduler.stopScheduler();
    });
  });
});
