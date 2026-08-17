import { RefreshToken } from '@prisma/client';
import BaseRepository from './base.repository';

export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor() {
    super('refreshToken');
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.model.findUnique({
      where: { token },
    });
  }

  async revokeToken(id: string): Promise<RefreshToken> {
    return this.model.update({
      where: { id },
      data: {
        isRevoked: true,
        version: { increment: 1 },
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<any> {
    return this.model.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
      },
    });
  }
}

export default RefreshTokenRepository;
