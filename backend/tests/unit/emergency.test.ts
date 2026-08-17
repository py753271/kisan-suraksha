import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SOSService } from '../../src/services/sos.service';
import { ShelterService } from '../../src/services/shelter.service';
import { ContactService } from '../../src/services/contact.service';
import { ResourceService } from '../../src/services/resource.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { ValidationError, NotFoundError } from '../../src/utils/errors';
import db from '../../src/config/database.config';

// Mock dependencies
const mockSosRepo = {
  findAllDetailed: jest.fn<any>(),
  findDetailById: jest.fn<any>(),
} as any;

const mockHistoryRepo = {
  findByRequestId: jest.fn<any>(),
} as any;

const mockWeatherService = {
  getCurrentWeather: jest.fn<any>(),
} as any;

const mockAlertService = {
  getLiveAlerts: jest.fn<any>(),
} as any;

const mockShelterRepo = {
  findNearestShelters: jest.fn<any>(),
  findMany: jest.fn<any>(),
  findById: jest.fn<any>(),
} as any;

const mockContactRepo = {
  findFiltered: jest.fn<any>(),
} as any;

const mockResourceRepo = {
  findLiveNearby: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
  invalidateByPattern: jest.fn<any>(),
  delCache: jest.fn<any>(),
}));

jest.mock('../../src/config/database.config', () => {
  return {
    __esModule: true,
    default: {
      sOSRequest: {
        create: jest.fn<any>(),
      },
      sOSHistory: {
        create: jest.fn<any>(),
      },
      emergencyShelter: {
        update: jest.fn<any>(),
      },
      auditLog: {
        create: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
    db: {
      sOSRequest: {
        create: jest.fn<any>(),
      },
      sOSHistory: {
        create: jest.fn<any>(),
      },
      emergencyShelter: {
        update: jest.fn<any>(),
      },
      auditLog: {
        create: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
  };
});

describe('Emergency & SOS Module Unit Tests (Phase 8)', () => {
  let sosService: SOSService;
  let shelterService: ShelterService;
  let contactService: ContactService;
  let resourceService: ResourceService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    sosService = new SOSService(mockSosRepo, mockHistoryRepo, mockWeatherService, mockAlertService);
    shelterService = new ShelterService(mockShelterRepo);
    contactService = new ContactService(mockContactRepo);
    resourceService = new ResourceService(mockResourceRepo);
  });

  describe('SOS Priority Escalation', () => {
    it('Should escalate SOS priority to Critical if weather is extreme (>43C)', async () => {
      mockWeatherService.getCurrentWeather.mockResolvedValue({ temp: 45, humidity: 30 });
      mockAlertService.getLiveAlerts.mockResolvedValue([]);

      const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 'sos-uuid-1', priority: 'Critical' });
      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          sOSRequest: { create: mockCreate },
          sOSHistory: { create: (jest.fn() as any).mockResolvedValue({}) },
          auditLog: { create: (jest.fn() as any).mockResolvedValue({}) },
        })
      );

      const result = await sosService.createSOS('user-uuid-123', {
        latitude: 22.3,
        longitude: 70.7,
        disasterType: 'Heatwave',
        priority: 'Medium',
      });

      expect(result.priority).toBe('Critical');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: 'Critical' }),
        })
      );
    });

    it('Should escalate SOS priority to Critical if severe active warning is nearby', async () => {
      mockWeatherService.getCurrentWeather.mockResolvedValue({ temp: 28, humidity: 50 });
      mockAlertService.getLiveAlerts.mockResolvedValue([{ category: 'flood', severity: 'severe' }]);

      const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 'sos-uuid-2', priority: 'Critical' });
      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          sOSRequest: { create: mockCreate },
          sOSHistory: { create: (jest.fn() as any).mockResolvedValue({}) },
          auditLog: { create: (jest.fn() as any).mockResolvedValue({}) },
        })
      );

      const result = await sosService.createSOS('user-uuid-123', {
        latitude: 22.3,
        longitude: 70.7,
        disasterType: 'Flood',
        priority: 'Low',
      });

      expect(result.priority).toBe('Critical');
    });
  });

  describe('Shelter Occupancy & Capacity Checks', () => {
    it('Should throw ValidationError if occupancy exceeds capacity limit', async () => {
      mockShelterRepo.findById.mockResolvedValue({ id: 'sh-1', name: 'Gondal School', capacity: 100 });

      await expect(shelterService.updateOccupancy('sh-1', 120)).rejects.toThrow(ValidationError);
    });

    it('Should update status to Full if currentOccupancy matches capacity', async () => {
      mockShelterRepo.findById.mockResolvedValue({ id: 'sh-1', name: 'Gondal School', capacity: 100 });

      const mockUpdate = (jest.fn() as any).mockResolvedValue({ id: 'sh-1', currentOccupancy: 100, status: 'Full' });
      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          emergencyShelter: { update: mockUpdate },
          auditLog: { create: (jest.fn() as any).mockResolvedValue({}) },
        })
      );

      const result = await shelterService.updateOccupancy('sh-1', 100);
      expect(result.status).toBe('Full');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Full', currentOccupancy: 100 }),
        })
      );
    });
  });

  describe('Nearby Resources & Contacts cache-aside', () => {
    it('Should fetch resources by proximity and cache outcomes', async () => {
      mockGet.mockResolvedValue(null);
      mockResourceRepo.findLiveNearby.mockResolvedValue([{ id: 'res-1', name: 'Rescue Boat' }]);
      mockSet.mockResolvedValue(true);

      const result = await resourceService.getNearbyResources(70.7, 22.3, 5);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Rescue Boat');
      expect(mockResourceRepo.findLiveNearby).toHaveBeenCalledWith(70.7, 22.3, 5);
      expect(mockSet).toHaveBeenCalled();
    });

    it('Should fetch helpline contacts and writeback cache', async () => {
      mockGet.mockResolvedValue(null);
      mockContactRepo.findFiltered.mockResolvedValue([{ id: 'c-1', name: 'NDRF Control Room', phone: '1078' }]);
      mockSet.mockResolvedValue(true);

      const result = await contactService.getContacts({ serviceType: 'Disaster-specific' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NDRF Control Room');
      expect(mockSet).toHaveBeenCalled();
    });
  });
});
