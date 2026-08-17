import { MapLayer } from '@prisma/client';
import BaseRepository from './base.repository';

export class MapRepository extends BaseRepository<MapLayer> {
  constructor() {
    super('mapLayer');
  }

  async findByName(name: string): Promise<MapLayer | null> {
    return this.model.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });
  }
}

export default MapRepository;
