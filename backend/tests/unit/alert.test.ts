import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AlertService } from '../../src/services/alert.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { ValidationError, ConflictError } from '../../src/utils/errors';
import db from '../../src/config/database.config';

// Deep mock repositories and database client transactions
const mockAlertRepo = {
  findFiltered: jest.fn<any>(),
  findDetailById: jest.fn<any>(),
  findLiveNearby: jest.fn<any>(),
  findLiveInBoundingBox: jest.fn<any>(),
  findHistory: jest.fn<any>(),
  getAlertStats: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
  invalidateByPattern: jest.fn<any>(),
  delCache: jest.fn<any>(),
}));

jest.mock('../../src/config/database.config', () => {
  return {
    __esModule: true,
    default: {
      alert: {
        findFirst: jest.fn<any>(),
        create: jest.fn<any>(),
      },
      alertCategory: {
        findMany: jest.fn<any>(),
      },
      alertSeverity: {
        findMany: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
    db: {
      alert: {
        findFirst: jest.fn<any>(),
        create: jest.fn<any>(),
      },
      alertCategory: {
        findMany: jest.fn<any>(),
      },
      alertSeverity: {
        findMany: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
  };
});

describe('Alert Module Unit Tests (Phase 5)', () => {
  let alertService: AlertService;
  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    alertService = new AlertService(mockAlertRepo);
  });

  describe('GeoJSON Polygon Validation', () => {
    it('Should throw ValidationError for non-polygon GeoJSON structures', async () => {
      const invalidGeo = { type: 'Point', coordinates: [70.7, 22.3] };
      const alertData = {
        title: 'Cyclone Warning',
        affectedArea: invalidGeo,
      };

      await expect(alertService.createAlert(alertData)).rejects.toThrow(ValidationError);
    });

    it('Should pass for valid Polygon structures', async () => {
      const validGeo = {
        type: 'Polygon',
        coordinates: [
          [
            [70.0, 22.0],
            [71.0, 22.0],
            [71.0, 23.0],
            [70.0, 23.0],
            [70.0, 22.0],
          ],
        ],
      };

      // Mock duplicate check and transaction
      (db.alert.findFirst as any).mockResolvedValue(null);
      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          alert: {
            create: (jest.fn() as any).mockResolvedValue({ id: 'alert-uuid-1', affectedArea: validGeo }),
          },
          alertHistory: {
            create: (jest.fn() as any).mockResolvedValue({}),
          },
          auditLog: {
            create: (jest.fn() as any).mockResolvedValue({}),
          },
        })
      );

      const data = {
        title: 'Cyclone Warning',
        description: 'Severe storm alert',
        categoryId: 'cat-uuid-1',
        severityId: 'sev-uuid-1',
        effectiveTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
        affectedArea: validGeo,
      };

      const result = await alertService.createAlert(data);
      expect(result).toBeDefined();
    });
  });

  describe('Scheduling & Lifecycle Status Checks', () => {
    it('Should mark status as Scheduled if effectiveTime is set in the future', async () => {
      const validGeo = {
        type: 'Polygon',
        coordinates: [
          [
            [70.0, 22.0],
            [71.0, 22.0],
            [71.0, 23.0],
            [70.0, 23.0],
            [70.0, 22.0],
          ],
        ],
      };

      const mockCreate = (jest.fn() as any).mockResolvedValue({
        id: 'alert-uuid-2',
        status: 'Scheduled',
      });

      (db.alert.findFirst as any).mockResolvedValue(null);
      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          alert: {
            create: mockCreate,
          },
          alertHistory: {
            create: (jest.fn() as any).mockResolvedValue({}),
          },
          auditLog: {
            create: (jest.fn() as any).mockResolvedValue({}),
          },
        })
      );

      const futureTime = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour later
      const data = {
        title: 'Cyclone Warning',
        description: 'Storm advisory',
        categoryId: 'cat-uuid-1',
        severityId: 'sev-uuid-1',
        effectiveTime: futureTime,
        expiryTime: new Date(Date.now() + 7200000).toISOString(),
        affectedArea: validGeo,
      };

      const result = await alertService.createAlert(data);
      expect(result.status).toBe('Scheduled');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Scheduled' }),
        })
      );
    });
  });

  describe('Deduplication Safeguards', () => {
    it('Should throw ConflictError if identical alert title/category matches active DB records', async () => {
      const validGeo = {
        type: 'Polygon',
        coordinates: [
          [
            [70.0, 22.0],
            [71.0, 22.0],
            [71.0, 23.0],
            [70.0, 23.0],
            [70.0, 22.0],
          ],
        ],
      };

      // Mock duplicate alert found
      (db.alert.findFirst as any).mockResolvedValue({ id: 'existing-alert-uuid' });

      const data = {
        title: 'Cyclone Warning',
        categoryId: 'cat-uuid-1',
        severityId: 'sev-uuid-1',
        effectiveTime: new Date().toISOString(),
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
        affectedArea: validGeo,
      };

      await expect(alertService.createAlert(data)).rejects.toThrow(ConflictError);
    });
  });

  describe('Live Alerts Spatial Queries', () => {
    it('Should query nearby radius alerts on cache miss and return values', async () => {
      mockGet.mockResolvedValue(null);
      mockAlertRepo.findLiveNearby.mockResolvedValue([{ id: 'live-alert-1', title: 'Flash Flood' }]);
      mockSet.mockResolvedValue(true);

      const result = await alertService.getLiveAlerts({ lon: 70.7, lat: 22.3, radius: 10000 });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Flash Flood');
      expect(mockAlertRepo.findLiveNearby).toHaveBeenCalledWith(70.7, 22.3, 10000);
      expect(mockSet).toHaveBeenCalled();
    });
  });
});
