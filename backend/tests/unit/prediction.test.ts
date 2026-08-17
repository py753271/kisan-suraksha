import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PredictionService } from '../../src/services/prediction.service';
import { ModelManagementService } from '../../src/services/model-management.service';
import { RecommendationService } from '../../src/services/recommendation.service';
import { RiskAnalysisService } from '../../src/services/risk-analysis.service';
import { ForecastService } from '../../src/services/forecast.service';
import { getCache, setCache } from '../../src/config/redis.config';
import { NotFoundError } from '../../src/utils/errors';
import db from '../../src/config/database.config';

// Mock dependencies
const mockPredictionRepo = {
  findByType: jest.fn<any>(),
  findAllDetailed: jest.fn<any>(),
} as any;

const mockModelRepo = {
  findActiveByType: jest.fn<any>(),
} as any;

const mockForecastRepo = {
  getLatestForecasts: jest.fn<any>(),
} as any;

jest.mock('../../src/config/redis.config', () => ({
  getCache: jest.fn<any>(),
  setCache: jest.fn<any>(),
  delCache: jest.fn<any>(),
}));

jest.mock('../../src/config/database.config', () => {
  return {
    __esModule: true,
    default: {
      predictionModel: {
        create: jest.fn<any>(),
      },
      predictionResult: {
        create: jest.fn<any>(),
      },
      predictionHistory: {
        create: jest.fn<any>(),
      },
      weatherForecast: {
        findMany: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
    db: {
      predictionModel: {
        create: jest.fn<any>(),
      },
      predictionResult: {
        create: jest.fn<any>(),
      },
      predictionHistory: {
        create: jest.fn<any>(),
      },
      weatherForecast: {
        findMany: jest.fn<any>(),
      },
      $transaction: jest.fn<any>(),
    },
  };
});

describe('AI Prediction & Decision Support Module Unit Tests (Phase 12)', () => {
  let predictionService: PredictionService;
  let modelService: ModelManagementService;
  let recommendation: RecommendationService;
  let risk: RiskAnalysisService;
  let forecast: ForecastService;

  const mockGet = getCache as jest.MockedFunction<typeof getCache>;
  const mockSet = setCache as jest.MockedFunction<typeof setCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    modelService = new ModelManagementService(mockModelRepo);
    recommendation = new RecommendationService();
    risk = new RiskAnalysisService();
    forecast = new ForecastService(mockForecastRepo);
    predictionService = new PredictionService(mockPredictionRepo, modelService, recommendation, risk);
  });

  describe('Model Management', () => {
    it('Should bootstrap default prediction model if active model is not registered', async () => {
      mockModelRepo.findActiveByType.mockResolvedValue(null);
      const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 'model-1', type: 'WEATHER_TREND' });
      (db.predictionModel.create as any).mockImplementation(mockCreate);

      const activeModel = await modelService.getActiveModel('WEATHER_TREND');
      expect(activeModel.id).toBe('model-1');
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('Risk Analysis & Recommendations', () => {
    it('Should return Critical risk level when confidence and severity are extreme', () => {
      const payload = { severity: 'Extreme', riskScore: 95 };
      expect(risk.categorizeRisk(0.95, payload)).toBe('Critical');
    });

    it('Should return appropriate advisory steps matching predictions', () => {
      const payload = { trend: 'dry' };
      const steps = recommendation.getAdvisory('WEATHER_TREND', payload);
      expect(steps).toContain('Increase irrigation frequencies.');
    });
  });

  describe('Prediction Service & cache-aside', () => {
    it('Should execute AI model simulation run and save results to databases', async () => {
      mockGet.mockResolvedValue(null);
      mockModelRepo.findActiveByType.mockResolvedValue({ id: 'model-1', type: 'WEATHER_TREND' });

      const mockCreateResult = (jest.fn() as any).mockResolvedValue({
        id: 'pred-1',
        predictionType: 'WEATHER_TREND',
        confidenceScore: 0.85,
      });

      (db.$transaction as any).mockImplementation((callback: any) =>
        callback({
          predictionResult: { create: mockCreateResult },
          predictionHistory: { create: (jest.fn() as any).mockResolvedValue({}) },
        })
      );

      const result = await predictionService.generatePrediction('WEATHER_TREND', 22.3, 70.7);
      expect(result.id).toBe('pred-1');
      expect(mockCreateResult).toHaveBeenCalled();
    });

    it('Should read predictions from cache on cache hit', async () => {
      const cached = [{ id: 'pred-1', confidenceScore: 0.85 }];
      mockGet.mockResolvedValue(cached);

      const result = await predictionService.getPredictions('WEATHER_TREND', 0.70);
      expect(result).toEqual(cached);
      expect(mockGet).toHaveBeenCalledWith('predictions:WEATHER_TREND:0.7');
      expect(mockPredictionRepo.findByType).not.toHaveBeenCalled();
    });
  });
});
