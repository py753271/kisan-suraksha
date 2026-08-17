import { Crop } from '@prisma/client';
import BaseRepository from './base.repository';

export class CropRepository extends BaseRepository<Crop> {
  constructor() {
    super('crop');
  }

  async findByName(name: string): Promise<Crop | null> {
    return this.model.findUnique({
      where: { name },
    });
  }
}

export default CropRepository;
