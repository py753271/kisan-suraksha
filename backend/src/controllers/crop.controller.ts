import { Request, Response } from 'express';
import CropService from '../services/crop.service';
import AdvisoryService from '../services/advisory.service';
import { sendSuccess } from '../utils/response';

export class CropController {
  private cropService: CropService;
  private advisoryService: AdvisoryService;

  constructor(cropService = new CropService(), advisoryService = new AdvisoryService()) {
    this.cropService = cropService;
    this.advisoryService = advisoryService;
  }

  getCurrentAdvisories = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const cropId = req.query.cropId ? String(req.query.cropId) : undefined;
    const stage = req.query.stage ? String(req.query.stage) : undefined;
    const season = req.query.season ? String(req.query.season) : undefined;

    const advisories = await this.advisoryService.getCurrentAdvisories(lat, lon, cropId, stage, season);
    sendSuccess(res, advisories, undefined, 'Current agricultural advisories compiled successfully');
  };

  getAdvisoryHistory = async (req: Request, res: Response): Promise<void> => {
    const cropId = req.query.cropId ? String(req.query.cropId) : undefined;
    const limit = Number(req.query.limit || 10);

    const history = await this.advisoryService.getAdvisoryHistory(cropId, limit);
    sendSuccess(res, history, undefined, 'Advisory generation history logs retrieved');
  };

  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    const lon = Number(req.query.lon);
    const lat = Number(req.query.lat);
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;

    const recommendations = await this.cropService.getRecommendations(lon, lat, categoryId);
    sendSuccess(res, recommendations, undefined, 'Regional crop suitability recommendations compiled');
  };

  getRisk = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const cropId = String(req.query.cropId);

    const advisories = await this.advisoryService.getCurrentAdvisories(lat, lon, cropId);
    const overallRisk = advisories.length > 0 ? advisories[0].calculatedRiskLevel : 'Low';

    sendSuccess(
      res,
      {
        cropId,
        overallRisk,
        matrix: {
          critical: 'Severe alerts active',
          high: 'Temperatures > 40C or moderate alerts active',
          moderate: 'Temperatures > 35C or humidity > 85%',
          low: 'Standard parameters',
        },
        matchedAdvisoriesCount: advisories.length,
      },
      undefined,
      'Crop vulnerability risk matrix compiled'
    );
  };
}

export default CropController;
