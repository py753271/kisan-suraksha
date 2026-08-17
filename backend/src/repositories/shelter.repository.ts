import { EmergencyShelter } from '@prisma/client';
import BaseRepository from './base.repository';
import db from '../config/database.config';

export class ShelterRepository extends BaseRepository<EmergencyShelter> {
  constructor() {
    super('emergencyShelter');
  }

  // PostGIS nearest-neighbor proximity check
  async findNearestShelters(lon: number, lat: number, limit = 5): Promise<any[]> {
    return db.$queryRaw`
      SELECT id, name, capacity, "currentOccupancy", "contactNumber", address,
             CAST(latitude as float) as latitude, CAST(longitude as float) as longitude,
             facilities, accessibility,
             ST_Distance(
               ST_SetSRID(ST_Point(longitude::float, latitude::float), 4326)::geography,
               ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)::geography
             ) as distance
      FROM "EmergencyShelter"
      WHERE "deletedAt" IS NULL
      ORDER BY ST_SetSRID(ST_Point(longitude::float, latitude::float), 4326) <-> ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)
      LIMIT ${limit};
    `;
  }
}

export default ShelterRepository;
