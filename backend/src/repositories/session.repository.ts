import { UserSession } from '@prisma/client';
import BaseRepository from './base.repository';

export class SessionRepository extends BaseRepository<UserSession> {
  constructor() {
    super('userSession');
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    return this.model.findMany({
      where: { userId },
    });
  }

  async deleteAllForUser(userId: string): Promise<any> {
    return this.model.deleteMany({
      where: { userId },
    });
  }
}

export default SessionRepository;
