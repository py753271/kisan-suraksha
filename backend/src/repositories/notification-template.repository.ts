import { NotificationTemplate } from '@prisma/client';
import BaseRepository from './base.repository';

export class NotificationTemplateRepository extends BaseRepository<NotificationTemplate> {
  constructor() {
    super('notificationTemplate');
  }

  async findByNameAndLang(name: string, language = 'en'): Promise<NotificationTemplate | null> {
    return this.model.findFirst({
      where: {
        name,
        language,
        deletedAt: null,
      },
    });
  }
}

export default NotificationTemplateRepository;
