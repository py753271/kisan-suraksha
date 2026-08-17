import { Request, Response } from 'express';
import PredictionService from '../services/prediction.service';
import { sendSuccess } from '../utils/response';
import { HTTP_STATUS } from '../constants';
import { AuthenticationError } from '../utils/errors';

export class PredictionController {
  private predictionService: PredictionService;

  constructor(predictionService = new PredictionService()) {
    this.predictionService = predictionService;
  }

  getWeatherPredictions = async (req: Request, res: Response): Promise<void> => {
    const threshold = Number(req.query.confidenceThreshold || 0.70);
    const list = await this.predictionService.getPredictions('WEATHER_TREND', threshold);
    sendSuccess(res, list, undefined, 'AI meteorological weather trends predictions compiled');
  };

  getRiskPredictions = async (req: Request, res: Response): Promise<void> => {
    const threshold = Number(req.query.confidenceThreshold || 0.70);
    const list = await this.predictionService.getPredictions('CROP_RISK', threshold);
    sendSuccess(res, list, undefined, 'AI crop vulnerability and advisory risk forecasts compiled');
  };

  getCropPredictions = async (req: Request, res: Response): Promise<void> => {
    const threshold = Number(req.query.confidenceThreshold || 0.70);
    const list = await this.predictionService.getPredictions('YIELD_ADVISORY', threshold);
    sendSuccess(res, list, undefined, 'AI crop yield advisory forecasts compiled');
  };

  getPredictionHistory = async (_req: Request, res: Response): Promise<void> => {
    const list = await this.predictionService.getPredictionHistory();
    sendSuccess(res, list, undefined, 'Historical predictions timelines compiled');
  };

  generatePrediction = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const { predictionType, lat, lon } = req.body;
    const prediction = await this.predictionService.generatePrediction(predictionType, lat, lon);
    sendSuccess(res, prediction, undefined, `Manual AI prediction run compiled for ${predictionType}`, HTTP_STATUS.CREATED);
  };
}

export default PredictionController;
