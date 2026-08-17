import { CropCategory } from '@prisma/client';
import BaseRepository from './base.repository';

export class CropCategoryRepository extends BaseRepository<CropCategory> {
  constructor() {
    super('cropCategory');
  }
}

export default CropCategoryRepository;
