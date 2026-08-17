import { Permission } from '@prisma/client';
import BaseRepository from './base.repository';

export class PermissionRepository extends BaseRepository<Permission> {
  constructor() {
    super('permission');
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.model.findUnique({
      where: { name },
    });
  }
}

export default PermissionRepository;
