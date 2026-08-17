import { NotificationLog } from '@prisma/client';
import BaseRepository from './base.repository';

export class NotificationLogRepository extends BaseRepository<NotificationLog> {
  constructor() {
    super('notificationLog');
  }

  async findByDeliveryId(deliveryId: string): Promise<NotificationLog[]> {
    return this.model.findMany({
      where: { deliveryId, deletedAt: null },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export default NotificationLogRepository;
