import { NotificationPreference } from '@prisma/client';
import BaseRepository from './base.repository';

export class NotificationPreferenceRepository extends BaseRepository<NotificationPreference> {
  constructor() {
    super('notificationPreference');
  }

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    return this.model.findMany({
      where: { userId, deletedAt: null },
    });
  }
}

export default NotificationPreferenceRepository;
