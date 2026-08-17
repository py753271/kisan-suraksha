import { User } from '@prisma/client';
import BaseRepository from './base.repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email },
    });
  }

  async findByEmailWithRoleAndPermissions(email: string): Promise<any | null> {
    return this.model.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async updateFailedLoginAttempts(userId: string, count: number, lockUntil: Date | null): Promise<User> {
    return this.model.update({
      where: { id: userId },
      data: {
        loginAttempts: count,
        lockUntil,
        version: { increment: 1 },
      },
    });
  }

  async resetFailedLoginAttempts(userId: string): Promise<User> {
    return this.model.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        version: { increment: 1 },
      },
    });
  }
}

export default UserRepository;
