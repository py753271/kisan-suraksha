import db from '../config/database.config';

export class BoundaryRepository {
  async findStateBoundary(code: string): Promise<any | null> {
    return db.state.findUnique({
      where: { code, deletedAt: null },
      select: { name: true, code: true, boundary: true },
    });
  }

  async findDistrictBoundary(code: string): Promise<any | null> {
    return db.district.findUnique({
      where: { code, deletedAt: null },
      select: { name: true, code: true, boundary: true },
    });
  }

  async findTehsilBoundary(code: string): Promise<any | null> {
    return db.tehsil.findUnique({
      where: { code, deletedAt: null },
      select: { name: true, code: true, boundary: true },
    });
  }

  async findVillageBoundary(code: string): Promise<any | null> {
    return db.village.findUnique({
      where: { code, deletedAt: null },
      select: { name: true, code: true, boundary: true },
    });
  }

  // Reverse Geocoding point-in-polygon raw query
  async findBoundaryByPoint(lon: number, lat: number): Promise<any | null> {
    const results: any[] = await db.$queryRaw`
      SELECT
        s.code as "stateCode", s.name as "stateName",
        d.code as "districtCode", d.name as "districtName",
        t.code as "tehsilCode", t.name as "tehsilName",
        v.code as "villageCode", v.name as "villageName"
      FROM "Village" v
      JOIN "Tehsil" t ON v."tehsilId" = t.id
      JOIN "District" d ON t."districtId" = d.id
      JOIN "State" s ON d."stateId" = s.id
      WHERE ST_Contains(
        ST_SetSRID(ST_GeomFromGeoJSON(v.boundary::text), 4326),
        ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)
      )
      AND v."deletedAt" IS NULL
      LIMIT 1;
    `;
    return results[0] || null;
  }

  // Case-insensitive partial name search across Districts and Villages
  async searchLocations(query: string, limit = 10): Promise<{ districts: any[]; villages: any[] }> {
    const [districts, villages] = await Promise.all([
      db.district.findMany({
        where: {
          deletedAt: null,
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          code: true,
          boundary: true,
          state: { select: { id: true, name: true, code: true } },
        },
        take: limit,
      }),
      db.village.findMany({
        where: {
          deletedAt: null,
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          code: true,
          boundary: true,
          tehsil: {
            select: {
              id: true,
              name: true,
              code: true,
              district: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  state: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
        },
        take: limit,
      }),
    ]);

    return { districts, villages };
  }
}

export default BoundaryRepository;
