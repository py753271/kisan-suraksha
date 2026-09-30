import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { LayerService } from '../../src/services/layer.service';
import { MapService } from '../../src/services/map.service';
import { SpatialService } from '../../src/services/spatial.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { NotFoundError } from '../../src/utils/errors';

// Mock repositories and database connection clients
const mockMapRepo = {
  findByName: jest.fn<any>(),
} as any;

const mockBoundaryRepo = {
  findStateBoundary: jest.fn<any>(),
  findDistrictBoundary: jest.fn<any>(),
  findTehsilBoundary: jest.fn<any>(),
  findVillageBoundary: jest.fn<any>(),
  findBoundaryByPoint: jest.fn<any>(),
  searchLocations: jest.fn<any>(),
} as any;

const mockShelterRepo = {
  findNearestShelters: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
}));

describe('GIS & Interactive Map Module Unit Tests (Phase 6)', () => {
  let layerService: LayerService;
  let mapService: MapService;
  let spatialService: SpatialService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    layerService = new LayerService(mockMapRepo);
    mapService = new MapService(mockBoundaryRepo);
    spatialService = new SpatialService(mockShelterRepo, mockBoundaryRepo);
  });

  describe('LayerService (Overlays Rendering)', () => {
    it('Should fetch layer from cache if available', async () => {
      const cachedLayer = { id: 'layer-1', name: 'flood_risk', geojson: {} };
      mockGet.mockResolvedValue(cachedLayer);

      const result = await layerService.getLayer('flood_risk');
      expect(result).toEqual(cachedLayer);
      expect(mockGet).toHaveBeenCalled();
      expect(mockMapRepo.findByName).not.toHaveBeenCalled();
    });

    it('Should fetch from DB and write to cache on cache miss', async () => {
      const dbRecord = {
        id: 'layer-1',
        name: 'flood_risk',
        type: 'overlay',
        geojson: { type: 'FeatureCollection', features: [] },
        updatedAt: new Date(),
      };
      mockGet.mockResolvedValue(null);
      mockMapRepo.findByName.mockResolvedValue(dbRecord);
      mockSet.mockResolvedValue(true);

      const result = await layerService.getLayer('flood_risk');
      expect(result.id).toBe(dbRecord.id);
      expect(mockMapRepo.findByName).toHaveBeenCalledWith('flood_risk');
      expect(mockSet).toHaveBeenCalled();
    });

    it('Should throw NotFoundError if layer name is missing in database', async () => {
      mockGet.mockResolvedValue(null);
      mockMapRepo.findByName.mockResolvedValue(null);

      await expect(layerService.getLayer('flood_risk')).rejects.toThrow(NotFoundError);
    });
  });

  describe('MapService (Boundaries Retrieval)', () => {
    it('Should query boundary and cache result on boundary selection', async () => {
      const mockState = { name: 'Gujarat', code: 'GJ', boundary: { type: 'Polygon', coordinates: [] } };
      mockGet.mockResolvedValue(null);
      mockBoundaryRepo.findStateBoundary.mockResolvedValue(mockState);
      mockSet.mockResolvedValue(true);

      const result = await mapService.getBoundary('state', 'GJ');
      expect(result.name).toBe('Gujarat');
      expect(mockBoundaryRepo.findStateBoundary).toHaveBeenCalledWith('GJ');
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('MapService (Location Search)', () => {
    it('Should return only PostgreSQL locations and ignore unmapped mock entries', async () => {
      mockGet.mockResolvedValue(null);
      mockBoundaryRepo.searchLocations.mockResolvedValue({
        districts: [{ id: 'd-1', name: 'Rajkot', code: 'GJ_RAJ', state: { name: 'Gujarat', code: 'GJ' } }],
        villages: [],
      });
      mockSet.mockResolvedValue(true);

      const results = await mapService.searchLocations('raj', 10);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Rajkot');
      expect(results[0].latitude).toBe(22.3039);
      expect(results[0].longitude).toBe(70.8022);
    });

    it('Should return null coordinates for DB locations without valid mapping or boundary instead of Rajkot fallback', async () => {
      mockGet.mockResolvedValue(null);
      mockBoundaryRepo.searchLocations.mockResolvedValue({
        districts: [{ id: 'd-99', name: 'Unknown District', code: 'UNKNOWN_CODE', boundary: null, state: { name: 'SomeState', code: 'SS' } }],
        villages: [],
      });
      mockSet.mockResolvedValue(true);

      const results = await mapService.searchLocations('unknown', 10);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Unknown District');
      expect(results[0].latitude).toBeNull();
      expect(results[0].longitude).toBeNull();
    });

    it('Should return empty array when DB returns no matches even if query matches old static mock dataset', async () => {
      mockGet.mockResolvedValue(null);
      mockBoundaryRepo.searchLocations.mockResolvedValue({
        districts: [],
        villages: [],
      });

      const results = await mapService.searchLocations('Bathinda', 10);
      expect(results).toEqual([]);
    });
  });

  describe('SpatialService (Proximity & Geocoding checks)', () => {
    it('Should find nearest shelters and calculate distances from points', async () => {
      const mockShelters = [
        { id: 'sh-1', name: 'Jetpur Shelter', distance: 1200 },
        { id: 'sh-2', name: 'Gondal Shelter', distance: 3400 },
      ];
      mockGet.mockResolvedValue(null);
      mockShelterRepo.findNearestShelters.mockResolvedValue(mockShelters);
      mockSet.mockResolvedValue(true);

      const result = await spatialService.getNearestShelters(70.7, 22.3, 5);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Jetpur Shelter');
      expect(mockShelterRepo.findNearestShelters).toHaveBeenCalledWith(70.7, 22.3, 5);
    });

    it('Should reverse geocode point coordinates into matching administrative boundaries', async () => {
      const mockResult = {
        stateCode: 'GJ',
        stateName: 'Gujarat',
        districtCode: 'GJ_RAJ',
        districtName: 'Rajkot',
        tehsilCode: 'GJ_RAJ_JET',
        tehsilName: 'Jetpur',
        villageCode: 'GJ_RAJ_JET_VIL',
        villageName: 'Jetpur Village',
      };
      mockGet.mockResolvedValue(null);
      mockBoundaryRepo.findBoundaryByPoint.mockResolvedValue(mockResult);
      mockSet.mockResolvedValue(true);

      const result = await spatialService.reverseGeocode(70.7, 22.3);
      expect(result.stateName).toBe('Gujarat');
      expect(result.villageName).toBe('Jetpur Village');
      expect(mockBoundaryRepo.findBoundaryByPoint).toHaveBeenCalledWith(70.7, 22.3);
    });
  });
});
