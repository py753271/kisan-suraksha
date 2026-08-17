import { NotificationDelivery } from '@prisma/client';
import BaseRepository from './base.repository';

export class NotificationDeliveryRepository extends BaseRepository<NotificationDelivery> {
  constructor() {
    super('notificationDelivery');
  }

  async findByNotificationId(notificationId: string): Promise<NotificationDelivery[]> {
    return this.model.findMany({
      where: { notificationId, deletedAt: null },
    });
  }
}

export default NotificationDeliveryRepository;
