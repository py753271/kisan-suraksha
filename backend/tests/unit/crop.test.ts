import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { RuleEngineService } from '../../src/services/rule-engine.service';
import { RiskAssessmentService } from '../../src/services/risk-assessment.service';
import { CropService } from '../../src/services/crop.service';
import { AdvisoryService } from '../../src/services/advisory.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { NotFoundError } from '../../src/utils/errors';

// Mock dependencies
const mockCropRepo = {
  findMany: jest.fn<any>(),
} as any;

const mockCategoryRepo = {} as any;

const mockBoundaryRepo = {
  findBoundaryByPoint: jest.fn<any>(),
} as any;

const mockAdvisoryRepo = {
  findAdvisories: jest.fn<any>(),
} as any;

const mockHistoryRepo = {
  findByCropId: jest.fn<any>(),
} as any;

const mockWeatherService = {
  getCurrentWeather: jest.fn<any>(),
} as any;

const mockAlertService = {
  getLiveAlerts: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
}));

jest.mock('../../src/config/database.config', () => ({
  __esModule: true,
  default: {
    advisoryHistory: {
      create: jest.fn<any>().mockResolvedValue({}),
    },
    alertCategory: {
      findMany: jest.fn<any>(),
    },
    alertSeverity: {
      findMany: jest.fn<any>(),
    },
  },
  db: {
    advisoryHistory: {
      create: jest.fn<any>().mockResolvedValue({}),
    },
    alertCategory: {
      findMany: jest.fn<any>(),
    },
    alertSeverity: {
      findMany: jest.fn<any>(),
    },
  },
}));

describe('Crop Advisory Module Unit Tests (Phase 7)', () => {
  let ruleEngine: RuleEngineService;
  let riskAssessment: RiskAssessmentService;
  let cropService: CropService;
  let advisoryService: AdvisoryService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    ruleEngine = new RuleEngineService();
    riskAssessment = new RiskAssessmentService();
    cropService = new CropService(mockCropRepo, mockCategoryRepo, mockBoundaryRepo);
    advisoryService = new AdvisoryService(
      mockAdvisoryRepo,
      mockHistoryRepo,
      mockWeatherService,
      mockAlertService,
      ruleEngine,
      riskAssessment
    );
  });

  describe('RuleEngineService', () => {
    it('Should return false if temperature is lower than tempGte condition', () => {
      const condition = { tempGte: 35 };
      const params = { temp: 32, humidity: 50, windSpeed: 10, alerts: [] };
      expect(ruleEngine.evaluate(condition, params)).toBe(false);
    });

    it('Should return true if temperature matches or exceeds tempGte condition', () => {
      const condition = { tempGte: 35 };
      const params = { temp: 37, humidity: 50, windSpeed: 10, alerts: [] };
      expect(ruleEngine.evaluate(condition, params)).toBe(true);
    });

    it('Should evaluate alert severity constraints successfully', () => {
      const condition = { requireAlertSeverity: 'severe' };
      const params = {
        temp: 30,
        humidity: 50,
        windSpeed: 10,
        alerts: [{ category: 'rain', severity: 'severe' }],
      };
      expect(ruleEngine.evaluate(condition, params)).toBe(true);

      const paramsNoAlert = { temp: 30, humidity: 50, windSpeed: 10, alerts: [] };
      expect(ruleEngine.evaluate(condition, paramsNoAlert)).toBe(false);
    });
  });

  describe('RiskAssessmentService', () => {
    it('Should return Critical if severe or extreme warnings exist', () => {
      const params = { temp: 28, humidity: 50, alerts: [{ severity: 'severe' }] };
      expect(riskAssessment.calculateRisk(params)).toBe('Critical');
    });

    it('Should return High if moderate alert exists or temperature exceeds 40C', () => {
      const paramsTemp = { temp: 42, humidity: 50, alerts: [] };
      expect(riskAssessment.calculateRisk(paramsTemp)).toBe('High');

      const paramsAlert = { temp: 30, humidity: 50, alerts: [{ severity: 'moderate' }] };
      expect(riskAssessment.calculateRisk(paramsAlert)).toBe('High');
    });

    it('Should return Low for normal conditions', () => {
      const params = { temp: 25, humidity: 45, alerts: [] };
      expect(riskAssessment.calculateRisk(params)).toBe('Low');
    });
  });

  describe('CropService (Recommendations)', () => {
    it('Should return state-specific crop recommendations', async () => {
      mockGet.mockResolvedValue(null);
      mockBoundaryRepo.findBoundaryByPoint.mockResolvedValue({ stateName: 'Punjab' });
      mockCropRepo.findMany.mockResolvedValue([
        { id: '1', name: 'Wheat', category: { name: 'Cereals' } },
        { id: '2', name: 'Cotton', category: { name: 'Cash Crops' } },
      ]);
      mockSet.mockResolvedValue(true);

      const result = await cropService.getRecommendations(70.7, 22.3);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Wheat');
      expect(result[0].suitabilityLevel).toBe('High');
    });
  });

  describe('AdvisoryService', () => {
    it('Should evaluate current advisory rules and cache result', async () => {
      mockGet.mockResolvedValue(null);
      mockWeatherService.getCurrentWeather.mockResolvedValue({ temp: 38, humidity: 45, windSpeed: 12 });
      mockAlertService.getLiveAlerts.mockResolvedValue([]);
      mockAdvisoryRepo.findAdvisories.mockResolvedValue([
        {
          id: 'adv-1',
          stage: 'Sowing',
          season: 'Rabi',
          ruleCondition: { tempGte: 35 },
          advisoryText: 'High temperature sowing warning advisory steps.',
          recommendedActions: ['Irregular watering', 'Shade nets'],
          riskLevel: 'Moderate',
          crop: { name: 'Wheat' },
        },
      ]);
      mockSet.mockResolvedValue(true);

      const result = await advisoryService.getCurrentAdvisories(22.3, 70.7, 'crop-uuid-1');
      expect(result).toHaveLength(1);
      expect(result[0].cropName).toBe('Wheat');
      expect(result[0].calculatedRiskLevel).toBe('Moderate'); // 38C temp flags Moderate risk
      expect(mockSet).toHaveBeenCalled();
    });
  });
});
