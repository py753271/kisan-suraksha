import { Role } from '@prisma/client';
import BaseRepository from './base.repository';

export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super('role');
  }

  async findByName(name: string): Promise<Role | null> {
    return this.model.findUnique({
      where: { name },
    });
  }
}

export default RoleRepository;
