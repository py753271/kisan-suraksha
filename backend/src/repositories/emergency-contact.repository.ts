import { EmergencyContact } from '@prisma/client';
import BaseRepository from './base.repository';

export class EmergencyContactRepository extends BaseRepository<EmergencyContact> {
  constructor() {
    super('emergencyContact');
  }

  async findFiltered(filters: {
    stateId?: string;
    districtId?: string;
    serviceType?: string;
  }): Promise<EmergencyContact[]> {
    const where: any = { deletedAt: null };

    if (filters.stateId) {
      where.stateId = filters.stateId;
    }
    if (filters.districtId) {
      where.districtId = filters.districtId;
    }
    if (filters.serviceType) {
      where.serviceType = { contains: filters.serviceType, mode: 'insensitive' };
    }

    return this.model.findMany({
      where,
      include: {
        state: { select: { name: true, code: true } },
        district: { select: { name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}

export default EmergencyContactRepository;
