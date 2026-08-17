import NotificationRepository from '../repositories/notification.repository';
import NotificationDeliveryRepository from '../repositories/notification-delivery.repository';
import PreferenceService from './preference.service';
import TemplateService from './template.service';
import QueueService from './queue.service';
import { getCache, setCache, delCache } from '../config/redis.config';
import { NotFoundError } from '../utils/errors';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class NotificationService {
  private notificationRepo: NotificationRepository;
  private deliveryRepo: NotificationDeliveryRepository;
  private preferenceService: PreferenceService;
  private templateService: TemplateService;
  private queueService: QueueService;

  constructor(
    notificationRepo = new NotificationRepository(),
    deliveryRepo = new NotificationDeliveryRepository(),
    preferenceService = new PreferenceService(),
    templateService = new TemplateService(),
    queueService = new QueueService()
  ) {
    this.notificationRepo = notificationRepo;
    this.deliveryRepo = deliveryRepo;
    this.preferenceService = preferenceService;
    this.templateService = templateService;
    this.queueService = queueService;
  }

  async sendNotification(userId: string, data: any): Promise<any> {
    // 1. Fetch user contacts details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, fullName: true },
    });
    if (!user) {
      throw new NotFoundError('Target user not found.');
    }

    // 2. Resolve preferences
    const preferences = await this.preferenceService.getPreferences(userId);
    const channelsToSend: string[] = [];

    // Fallback default: if no preference rows found, default channels are SMS and Push
    if (preferences.length === 0) {
      channelsToSend.push('Push', 'SMS');
    } else {
      // Check quiet hours
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const timeMinutes = currentHour * 60 + currentMin;

      for (const pref of preferences) {
        if (!pref.isEnabled) continue;

        let insideQuietHours = false;
        if (pref.quietHoursStart && pref.quietHoursEnd) {
          const [startH, startM] = pref.quietHoursStart.split(':').map(Number);
          const [endH, endM] = pref.quietHoursEnd.split(':').map(Number);
          const startMin = startH * 60 + startM;
          const endMin = endH * 60 + endM;

          if (startMin <= endMin) {
            insideQuietHours = timeMinutes >= startMin && timeMinutes <= endMin;
          } else {
            // Overnights quiet hours (e.g. 22:00 to 06:00)
            insideQuietHours = timeMinutes >= startMin || timeMinutes <= endMin;
          }
        }

        const isEmergency = data.priority === 'High';
        const bypassQuietHours = pref.emergencyOverride && isEmergency;

        if (!insideQuietHours || bypassQuietHours) {
          channelsToSend.push(pref.channel);
        } else {
          logger.warn(`Quiet hours active for user ${userId} on channel ${pref.channel}. Skipping standard dispatch.`);
        }
      }
    }

    if (channelsToSend.length === 0) {
      logger.info(`No channels permitted for dispatch to user: ${userId}. Skipping.`);
      return null;
    }

    // 3. Render content using templates if templateId is specified
    let finalTitle = data.title;
    let finalBody = data.body;
    if (data.templateId) {
      try {
        const template = await this.templateService.getTemplate(data.templateId, 'en');
        if (template) {
          finalTitle = template.subject || finalTitle;
          finalBody = this.templateService.render(template.body, {
            name: user.fullName,
            title: data.title,
            body: data.body,
          });
        }
      } catch (_err) {
        logger.warn('Failed locating/rendering template. Falling back to raw title/body payload.');
      }
    }

    // 4. Write records in transaction
    const notification = await db.$transaction(async (tx: any) => {
      const record = await tx.notification.create({
        data: {
          userId,
          alertId: data.alertId || null,
          templateId: data.templateId || null,
          title: finalTitle,
          body: finalBody,
          category: data.category,
          priority: data.priority || 'Normal',
          status: 'Pending',
          createdBy: 'System',
        },
      });

      const deliveries: any[] = [];
      for (const channel of channelsToSend) {
        let recipient = '';
        if (channel === 'Push') recipient = userId;
        else if (channel === 'SMS' || channel === 'WhatsApp') recipient = user.phone || 'N/A';
        else if (channel === 'Email') recipient = user.email;

        const delivery = await tx.notificationDelivery.create({
          data: {
            notificationId: record.id,
            channel,
            recipient,
            status: 'Pending',
            createdBy: 'System',
          },
        });
        deliveries.push(delivery);
      }

      return { ...record, deliveries };
    });

    // 5. Enqueue BullMQ dispatch jobs
    const priorityQueue = data.priority || 'Normal';
    for (const d of notification.deliveries) {
      await this.queueService.addJob(priorityQueue, {
        deliveryId: d.id,
        channel: d.channel,
        recipient: d.recipient,
        payload: { title: finalTitle, body: finalBody },
      });
    }

    // Clear caches
    await delCache(`user:unread:${userId}`);
    await delCache(`user:notifications:${userId}`);
    return notification;
  }

  async broadcast(data: any): Promise<any> {
    // Find target users matching filters
    const where: any = { deletedAt: null };
    if (data.filters?.stateId) {
      where.savedLocations = { some: { stateId: data.filters.stateId } };
    } else if (data.filters?.districtId) {
      where.savedLocations = { some: { districtId: data.filters.districtId } };
    }

    const users = await db.user.findMany({
      where,
      select: { id: true },
    });

    logger.info(`Broadcasting notification to ${users.length} matching target users.`);
    const results: any[] = [];
    for (const u of users) {
      const res = await this.sendNotification(u.id, data);
      if (res) results.push(res);
    }

    return {
      broadcastCount: users.length,
      triggeredCount: results.length,
    };
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    const cacheKey = `user:notifications:${userId}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const list = await this.notificationRepo.findUserNotifications(userId);
    await setCache(cacheKey, list, 60);
    return list;
  }

  async getNotificationById(id: string): Promise<any> {
    const record = await this.notificationRepo.findDetailById(id);
    if (!record) {
      throw new NotFoundError('Notification not found.');
    }
    return record;
  }

  async markAsRead(id: string): Promise<any> {
    const record = await this.notificationRepo.findById(id);
    if (!record) {
      throw new NotFoundError('Notification not found.');
    }

    const updated = await db.notification.update({
      where: { id },
      data: { status: 'Read', version: { increment: 1 } },
    });

    if (record.userId) {
      await delCache(`user:unread:${record.userId}`);
      await delCache(`user:notifications:${record.userId}`);
    }

    logger.info(`Notification ${id} marked as Read.`);
    return updated;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `user:unread:${userId}`;
    const cached = await getCache<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const count = await this.notificationRepo.findUnreadCount(userId);
    await setCache(cacheKey, count, 60);
    return count;
  }
}

export default NotificationService;
