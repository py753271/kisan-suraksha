import { EmergencyResource } from '@prisma/client';
import BaseRepository from './base.repository';
import db from '../config/database.config';

export class EmergencyResourceRepository extends BaseRepository<EmergencyResource> {
  constructor() {
    super('emergencyResource');
  }

  // Proximity query matching available emergency assets
  async findLiveNearby(lon: number, lat: number, limit = 5): Promise<any[]> {
    return db.$queryRaw`
      SELECT id, name, description, quantity, "locationName", "contactPerson", "contactPhone", status,
             CAST(latitude as float) as latitude, CAST(longitude as float) as longitude,
             ST_Distance(
               ST_SetSRID(ST_Point(longitude::float, latitude::float), 4326)::geography,
               ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)::geography
             ) as distance
      FROM "EmergencyResource"
      WHERE "deletedAt" IS NULL 
        AND status = 'Available'
      ORDER BY ST_SetSRID(ST_Point(longitude::float, latitude::float), 4326) <-> ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)
      LIMIT ${limit};
    `;
  }
}

export default EmergencyResourceRepository;
