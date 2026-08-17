import { SOSRequest } from '@prisma/client';
import BaseRepository from './base.repository';

export class SOSRepository extends BaseRepository<SOSRequest> {
  constructor() {
    super('sosRequest');
  }

  async findDetailById(id: string): Promise<any | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        location: true,
      },
    });
  }

  async findAllDetailed(): Promise<any[]> {
    return this.model.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default SOSRepository;
