import { Notification } from '@prisma/client';
import BaseRepository from './base.repository';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notification');
  }

  async findDetailById(id: string): Promise<any | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        deliveries: true,
      },
    });
  }

  async findUnreadCount(userId: string): Promise<number> {
    // Unread counts are notifications delivered ('Sent') but not yet marked as 'Read'
    return this.model.count({
      where: {
        userId,
        status: 'Sent',
        deletedAt: null,
      },
    });
  }

  async findUserNotifications(userId: string): Promise<Notification[]> {
    return this.model.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default NotificationRepository;
