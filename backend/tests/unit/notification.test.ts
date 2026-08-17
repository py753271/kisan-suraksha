import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NotificationService } from '../../src/services/notification.service';
import { PreferenceService } from '../../src/services/preference.service';
import { TemplateService } from '../../src/services/template.service';
import { QueueService } from '../../src/services/queue.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { NotFoundError } from '../../src/utils/errors';
import db from '../../src/config/database.config';

// Mock dependencies
const mockNotificationRepo = {
  findUserNotifications: jest.fn<any>(),
  findDetailById: jest.fn<any>(),
  findUnreadCount: jest.fn<any>(),
  findById: jest.fn<any>(),
} as any;

const mockDeliveryRepo = {} as any;

const mockPreferenceRepo = {
  findByUserId: jest.fn<any>(),
} as any;

const mockTemplateRepo = {
  findByNameAndLang: jest.fn<any>(),
} as any;

const mockQueueService = {
  addJob: jest.fn<any>(),
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
      user: {
        findUnique: jest.fn<any>(),
        findMany: jest.fn<any>(),
      },
      notification: {
        create: jest.fn<any>(),
        update: jest.fn<any>(),
      },
      notificationDelivery: {
        create: jest.fn<any>(),
      },
      notificationPreference: {
        upsert: jest.fn<any>(),
      },
      auditLog: {
        create: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
    db: {
      user: {
        findUnique: jest.fn<any>(),
        findMany: jest.fn<any>(),
      },
      notification: {
        create: jest.fn<any>(),
        update: jest.fn<any>(),
      },
      notificationDelivery: {
        create: jest.fn<any>(),
      },
      notificationPreference: {
        upsert: jest.fn<any>(),
      },
      auditLog: {
        create: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
  };
});

describe('Notification & Communication Module Unit Tests (Phase 9)', () => {
  let notificationService: NotificationService;
  let preferenceService: PreferenceService;
  let templateService: TemplateService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    preferenceService = new PreferenceService(mockPreferenceRepo);
    templateService = new TemplateService(mockTemplateRepo);
    notificationService = new NotificationService(
      mockNotificationRepo,
      mockDeliveryRepo,
      preferenceService,
      templateService,
      mockQueueService as unknown as QueueService
    );
  });

  describe('Template Engine', () => {
    it('Should replace matching parameters in a text template', () => {
      const body = 'Hello {{ name }}, temperature in your district is {{ temp }}C.';
      const variables = { name: 'Ramesh', temp: 39 };
      const rendered = templateService.render(body, variables);
      expect(rendered).toBe('Hello Ramesh, temperature in your district is 39C.');
    });
  });

  describe('Quiet Hours & Emergency Overrides', () => {
    it('Should bypass quiet hours if notification is High priority and override is enabled', async () => {
      mockGet.mockResolvedValue(null);
      // Quiet hours active (e.g. 22:00 to 06:00), it's 23:00 (1380 minutes)
      const now = new Date();
      now.setHours(23, 0, 0, 0);
      jest.useFakeTimers().setSystemTime(now);

      mockPreferenceRepo.findByUserId.mockResolvedValue([
        {
          channel: 'Push',
          isEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
          emergencyOverride: true,
        },
      ]);

      mockNotificationRepo.findDetailById.mockResolvedValue({ id: 'n-1' });
      (db.user.findUnique as any).mockResolvedValue({
        id: 'u-1',
        fullName: 'Kiran Kumar',
        phone: '9988776655',
        email: 'kiran@gmail.com',
      });

      const mockCreateNotification = (jest.fn() as any).mockResolvedValue({
        id: 'n-1',
        deliveries: [{ id: 'd-1', channel: 'Push', recipient: 'u-1' }],
      });

      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          notification: { create: mockCreateNotification },
          notificationDelivery: { create: (jest.fn() as any).mockResolvedValue({}) },
        })
      );

      mockQueueService.addJob.mockResolvedValue(undefined);

      const result = await notificationService.sendNotification('u-1', {
        title: 'Emergency Flood Alert',
        body: 'Heavy rainfall warning active.',
        category: 'Alert',
        priority: 'High',
      });

      expect(result).toBeDefined();
      expect(mockQueueService.addJob).toHaveBeenCalledWith('High', expect.any(Object));

      jest.useRealTimers();
    });

    it('Should skip standard priority notifications inside quiet hours', async () => {
      mockGet.mockResolvedValue(null);
      const now = new Date();
      now.setHours(23, 0, 0, 0);
      jest.useFakeTimers().setSystemTime(now);

      mockPreferenceRepo.findByUserId.mockResolvedValue([
        {
          channel: 'Push',
          isEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
          emergencyOverride: true,
        },
      ]);

      (db.user.findUnique as any).mockResolvedValue({
        id: 'u-1',
        fullName: 'Kiran Kumar',
        phone: '9988776655',
        email: 'kiran@gmail.com',
      });

      const result = await notificationService.sendNotification('u-1', {
        title: 'Weekly Crop Recs',
        body: 'Consider standard watering cycle.',
        category: 'Crop',
        priority: 'Normal',
      });

      expect(result).toBeNull();
      expect(mockQueueService.addJob).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Unread Counters and Caching', () => {
    it('Should check unread count cache and return counts', async () => {
      mockGet.mockResolvedValue(4);

      const result = await notificationService.getUnreadCount('u-1');
      expect(result).toBe(4);
      expect(mockGet).toHaveBeenCalledWith('user:unread:u-1');
      expect(mockNotificationRepo.findUnreadCount).not.toHaveBeenCalled();
    });

    it('Should invalidate user notifications unread count on reading updates', async () => {
      mockNotificationRepo.findById.mockResolvedValue({ id: 'n-1', userId: 'u-1', status: 'Sent' });
      (db.notification.update as any).mockResolvedValue({ id: 'n-1', status: 'Read' });

      await notificationService.markAsRead('n-1');
      expect(db.notification.update).toHaveBeenCalled();
    });
  });
});
