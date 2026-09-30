import BoundaryRepository from '../repositories/boundary.repository';
import { getCache, setCache } from '../config/redis.config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../config/logger.config';

export class MapService {
  private boundaryRepo: BoundaryRepository;

  constructor(boundaryRepo = new BoundaryRepository()) {
    this.boundaryRepo = boundaryRepo;
  }

  async getBoundary(type: string, code: string): Promise<any> {
    const cacheKey = `map:boundary:${type}:${code}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for boundary: ${cacheKey}`);
      return cached;
    }

    let result: any = null;
    switch (type) {
      case 'state':
        result = await this.boundaryRepo.findStateBoundary(code);
        break;
      case 'district':
        result = await this.boundaryRepo.findDistrictBoundary(code);
        break;
      case 'tehsil':
        result = await this.boundaryRepo.findTehsilBoundary(code);
        break;
      case 'village':
        result = await this.boundaryRepo.findVillageBoundary(code);
        break;
      default:
        throw new ValidationError(`Invalid boundary lookup type: ${type}`);
    }

    if (!result) {
      throw new NotFoundError(`${type.charAt(0).toUpperCase() + type.slice(1)} boundary with code '${code}' not found.`);
    }

    // Cache administrative bounds for 1 hour (3600 seconds)
    await setCache(cacheKey, result, 3600);
    return result;
  }

  async searchLocations(q: string, limit = 10): Promise<any[]> {
    const cleanQuery = q.trim();
    if (cleanQuery.length < 2) {
      return [];
    }

    const cacheKey = `map:search:${cleanQuery.toLowerCase()}:${limit}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for location search: ${cacheKey}`);
      return cached;
    }

    const COORDINATE_MAP: Record<string, { lat: number; lon: number }> = {
      'GJ_RAJ': { lat: 22.3039, lon: 70.8022 },
      'GJ_AHM': { lat: 23.0225, lon: 72.5714 },
      'GJ_SUR': { lat: 21.1702, lon: 72.8311 },
      'BR_PAT': { lat: 25.5941, lon: 85.1376 },
      'BR_GAY': { lat: 24.7955, lon: 85.0002 },
      'PB_ASR': { lat: 31.6340, lon: 74.8723 },
      'PB_BTI': { lat: 30.2110, lon: 74.9455 },
      'MH_SAT': { lat: 17.6805, lon: 74.0183 },
      'MH_PUN': { lat: 18.5204, lon: 73.8567 },
      'KA_TUM': { lat: 13.3379, lon: 77.1173 },
      'KA_BLR': { lat: 12.9716, lon: 77.5946 },
      'GJ_RAJ_JET': { lat: 21.7589, lon: 70.6221 },
      'GJ_RAJ_JET_VIL': { lat: 21.7589, lon: 70.6221 },
      'GJ_RAJ_GON': { lat: 21.9619, lon: 70.7923 },
      'GJ_RAJ_DHO': { lat: 21.7337, lon: 70.4497 },
      'PB_BTI_BM': { lat: 30.2583, lon: 75.0483 },
      'PB_BTI_MA': { lat: 30.0811, lon: 75.2415 },
      'PB_BTI_MA_VIL': { lat: 30.0811, lon: 75.2415 },
      'BR_PAT_DAN': { lat: 25.6297, lon: 85.0442 },
      'BR_PAT_DAN_VIL': { lat: 25.6297, lon: 85.0442 },
      'BR_PAT_MAN': { lat: 25.6483, lon: 84.8783 },
      'MH_SAT_KAR': { lat: 17.2885, lon: 74.1843 },
      'MH_SAT_WAI': { lat: 17.9427, lon: 73.8966 },
      'KA_TUM_GUB': { lat: 13.3106, lon: 76.9422 },
      'KA_TUM_SIR': { lat: 13.7447, lon: 76.9038 },
    };

    const extractGeoJsonCentroid = (boundary: any): { lat: number; lon: number } | null => {
      if (!boundary || typeof boundary !== 'object') return null;
      try {
        let geometry = boundary;
        if (boundary.type === 'FeatureCollection' && Array.isArray(boundary.features) && boundary.features.length > 0) {
          geometry = boundary.features[0].geometry;
        } else if (boundary.type === 'Feature' && boundary.geometry) {
          geometry = boundary.geometry;
        }
        if (!geometry || !geometry.coordinates) return null;

        let sumLat = 0;
        let sumLon = 0;
        let count = 0;

        const processCoords = (coords: any) => {
          if (!Array.isArray(coords) || coords.length === 0) return;
          if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            sumLon += coords[0];
            sumLat += coords[1];
            count++;
          } else {
            for (const c of coords) {
              processCoords(c);
            }
          }
        };

        processCoords(geometry.coordinates);
        if (count > 0) {
          return {
            lat: Number((sumLat / count).toFixed(6)),
            lon: Number((sumLon / count).toFixed(6)),
          };
        }
      } catch (err) {
        // Return null on geometry parse failure
      }
      return null;
    };

    const getCoordinates = (code?: string, boundary?: any): { lat: number | null; lon: number | null } => {
      if (code && COORDINATE_MAP[code]) {
        return COORDINATE_MAP[code];
      }
      const centroid = extractGeoJsonCentroid(boundary);
      if (centroid) {
        return centroid;
      }
      return { lat: null, lon: null };
    };

    const dbResults = await this.boundaryRepo.searchLocations(cleanQuery, limit);
    const results: any[] = [];
    const seenIds = new Set<string>();

    // 1. Process DB Districts
    for (const d of dbResults.districts || []) {
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        const coords = getCoordinates(d.code, d.boundary);
        results.push({
          id: d.id,
          type: 'district',
          name: d.name,
          displayName: `${d.name} District, ${d.state?.name || ''}`.trim(),
          stateName: d.state?.name || '',
          stateCode: d.state?.code || '',
          districtName: d.name,
          districtId: d.id,
          latitude: coords.lat,
          longitude: coords.lon,
          lat: coords.lat,
          lng: coords.lon,
        });
      }
    }

    // 2. Process DB Villages
    for (const v of dbResults.villages || []) {
      if (!seenIds.has(v.id)) {
        seenIds.add(v.id);
        const district = v.tehsil?.district;
        const state = district?.state;
        const coords = getCoordinates(v.code, v.boundary) || getCoordinates(district?.code, district?.boundary);
        results.push({
          id: v.id,
          type: 'village',
          name: v.name,
          displayName: `${v.name}, ${district?.name ? district.name + ', ' : ''}${state?.name || ''}`.trim(),
          stateName: state?.name || '',
          stateCode: state?.code || '',
          districtName: district?.name || '',
          districtId: district?.id,
          villageId: v.id,
          latitude: coords.lat,
          longitude: coords.lon,
          lat: coords.lat,
          lng: coords.lon,
        });
      }
    }

    // 3. Sort results according to Phase 4 ranking rules:
    // 1. Exact name match
    // 2. Starts-with match
    // 3. Contains match
    const qLower = cleanQuery.toLowerCase();
    results.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName === qLower && bName !== qLower) return -1;
      if (bName === qLower && aName !== qLower) return 1;
      if (aName.startsWith(qLower) && !bName.startsWith(qLower)) return -1;
      if (bName.startsWith(qLower) && !aName.startsWith(qLower)) return 1;
      return aName.localeCompare(bName);
    });

    const finalResults = results.slice(0, limit);

    // Cache results for 300 seconds (5 minutes)
    await setCache(cacheKey, finalResults, 300);
    return finalResults;
  }
}

export default MapService;
