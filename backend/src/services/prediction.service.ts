import PredictionRepository from '../repositories/prediction.repository';
import ModelManagementService from './model-management.service';
import RecommendationService from './recommendation.service';
import RiskAnalysisService from './risk-analysis.service';
import { getCache, setCache, delCache } from '../config/redis.config';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class PredictionService {
  private predictionRepo: PredictionRepository;
  private modelService: ModelManagementService;
  private recommendation: RecommendationService;
  private risk: RiskAnalysisService;

  constructor(
    predictionRepo = new PredictionRepository(),
    modelService = new ModelManagementService(),
    recommendation = new RecommendationService(),
    risk = new RiskAnalysisService()
  ) {
    this.predictionRepo = predictionRepo;
    this.modelService = modelService;
    this.recommendation = recommendation;
    this.risk = risk;
  }

  async generatePrediction(type: string, lat: number, lon: number): Promise<any> {
    logger.info(`🚨 Executing AI model prediction generate for type: ${type} at location [${lat}, ${lon}]`);

    // 1. Resolve active prediction model version
    const model = await this.modelService.getActiveModel(type);

    // 2. Mock model outputs payload
    let payload: any = {};
    const confidenceScore = 0.72 + Math.random() * 0.22; // range 0.72 to 0.94

    if (type === 'WEATHER_TREND') {
      payload = {
        trend: Math.random() > 0.5 ? 'dry' : 'wet',
        severity: 'Moderate',
        riskScore: 45,
        estimatedRainfallMm: 120,
        explanation: 'Historical weather analysis indicates an incoming monsoonal dry phase.',
      };
    } else if (type === 'CROP_RISK') {
      payload = {
        riskType: Math.random() > 0.5 ? 'Pest Outbreak' : 'Fungal Disease',
        severity: 'Severe',
        riskScore: 82,
        explanation: 'Elevated humidity readings forecast active fungal spore germination.',
      };
    } else {
      payload = {
        yieldIndex: 85,
        suitabilityScore: 92,
        explanation: 'Predicted yields are optimal based on crop vegetative stage timelines.',
      };
    }

    const calculatedAdvisory = this.recommendation.getAdvisory(type, payload);
    const calculatedRiskLevel = this.risk.categorizeRisk(confidenceScore, payload);

    const forecastTime = new Date();
    forecastTime.setDate(forecastTime.getDate() + 7); // predicts 7 days out

    // 3. Write prediction result in database transaction
    const result = await db.$transaction(async (tx: any) => {
      const record = await tx.predictionResult.create({
        data: {
          modelId: model.id,
          targetArea: { type: 'Point', coordinates: [lon, lat] },
          predictionType: type,
          confidenceScore,
          payload: {
            ...payload,
            advisory: calculatedAdvisory,
            calculatedRiskLevel,
            source: 'AI',
            expiresAt: new Date(Date.now() + 86400000), // 1 day TTL
          },
          forecastTime,
          createdBy: 'AI Engine',
        },
      });

      // Write timeline history entry
      await tx.predictionHistory.create({
        data: {
          predictionId: record.id,
          isAccurate: null,
          verificationNotes: 'Pending actual observations checks.',
          createdBy: 'System',
        },
      });

      return record;
    });

    // Invalidate prediction caches
    await delCache(`predictions:${type}`);
    await delCache('predictions:history');
    logger.info(`AI Prediction output created successfully: ${result.id}`);

    return result;
  }

  async getPredictions(type: string, threshold = 0.70): Promise<any[]> {
    const cacheKey = `predictions:${type}:${threshold}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const list = await this.predictionRepo.findByType(type, threshold);
    await setCache(cacheKey, list, 600); // 10 minutes TTL
    return list;
  }

  async getPredictionHistory(): Promise<any[]> {
    const cacheKey = 'predictions:history';
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const list = await this.predictionRepo.findAllDetailed();
    await setCache(cacheKey, list, 60);
    return list;
  }
}

export default PredictionService;
