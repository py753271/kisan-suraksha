import CropAdvisoryRepository from '../repositories/crop-advisory.repository';
import AdvisoryHistoryRepository from '../repositories/advisory-history.repository';
import WeatherService from './weather.service';
import AlertService from './alert.service';
import RuleEngineService from './rule-engine.service';
import RiskAssessmentService from './risk-assessment.service';
import { getCache, setCache } from '../config/redis.config';
import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class AdvisoryService {
  private advisoryRepo: CropAdvisoryRepository;
  private historyRepo: AdvisoryHistoryRepository;
  private weatherService: WeatherService;
  private alertService: AlertService;
  private ruleEngine: RuleEngineService;
  private riskAssessment: RiskAssessmentService;

  constructor(
    advisoryRepo = new CropAdvisoryRepository(),
    historyRepo = new AdvisoryHistoryRepository(),
    weatherService = new WeatherService(),
    alertService = new AlertService(),
    ruleEngine = new RuleEngineService(),
    riskAssessment = new RiskAssessmentService()
  ) {
    this.advisoryRepo = advisoryRepo;
    this.historyRepo = historyRepo;
    this.weatherService = weatherService;
    this.alertService = alertService;
    this.ruleEngine = ruleEngine;
    this.riskAssessment = riskAssessment;
  }

  async getCurrentAdvisories(
    lat: number,
    lon: number,
    cropId?: string,
    stage?: string,
    season?: string
  ): Promise<any[]> {
    const cacheKey = `advisories:current:${lat.toFixed(2)}:${lon.toFixed(2)}:${cropId || 'all'}:${stage || 'all'}:${season || 'all'}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) {
      logger.info(`Redis cache hit for current advisories: ${cacheKey}`);
      return cached;
    }

    // 1. Fetch current weather conditions
    let temp = 28;
    let humidity = 60;
    let windSpeed = 10;
    try {
      const weather = await this.weatherService.getCurrentWeather(lat, lon);
      if (weather) {
        temp = weather.temp;
        humidity = weather.humidity;
        windSpeed = weather.windSpeed || 10;
      }
    } catch (_err) {
      logger.warn('Climatic weather fetch failed during advisory compile. Proceeding with defaults.');
    }

    // 2. Fetch live active alerts near coordinates (15km radius)
    let alerts: any[] = [];
    try {
      alerts = await this.alertService.getLiveAlerts({ lon, lat, radius: 15000 });
    } catch (_err) {
      logger.warn('Spatial alerts fetch failed during advisory compile. Proceeding with empty warning stack.');
    }

    // 3. Query advisories templates
    const advisories = await this.advisoryRepo.findAdvisories(cropId, stage, season) as any[];

    const matchedAdvisories: any[] = [];

    // 4. Run rule engine evaluation
    for (const advisory of advisories) {
      const isMatch = this.ruleEngine.evaluate(advisory.ruleCondition, {
        temp,
        humidity,
        windSpeed,
        alerts,
      });

      if (isMatch) {
        // Calculate dynamic overall risk level
        const calculatedRisk = this.riskAssessment.calculateRisk({
          temp,
          humidity,
          alerts,
        });

        const resultRecord = {
          id: advisory.id,
          cropName: advisory.crop.name,
          stage: advisory.stage,
          season: advisory.season,
          advisoryText: advisory.advisoryText,
          recommendedActions: advisory.recommendedActions,
          baseRiskLevel: advisory.riskLevel,
          calculatedRiskLevel: calculatedRisk,
          evaluatedAt: new Date(),
        };

        matchedAdvisories.push(resultRecord);

        // 5. Audit log and insert execution to history DB
        try {
          await db.advisoryHistory.create({
            data: {
              advisoryId: advisory.id,
              inputParams: {
                weather: { temp, humidity, windSpeed },
                alertsCount: alerts.length,
              },
              generatedAdvisoryText: advisory.advisoryText,
              generatedRiskLevel: calculatedRisk,
              createdBy: 'System',
            },
          });
        } catch (historyErr) {
          logger.error('Failed logging advisory generation record into database:', historyErr);
        }
      }
    }

    // Cache advisories results for 5 minutes (300 seconds)
    await setCache(cacheKey, matchedAdvisories, 300);
    return matchedAdvisories;
  }

  async getAdvisoryHistory(cropId?: string, limit = 10): Promise<any[]> {
    const history = await this.historyRepo.findByCropId(cropId, limit) as any[];
    return history.map((h) => ({
      id: h.id,
      cropName: h.advisory.crop.name,
      stage: h.advisory.stage,
      season: h.advisory.season,
      advisoryText: h.generatedAdvisoryText,
      riskLevel: h.generatedRiskLevel,
      generatedAt: h.generatedAt,
      inputParams: h.inputParams,
    }));
  }
}

export default AdvisoryService;
