import { Request, Response } from 'express';
import AlertService from '../services/alert.service';
import { sendSuccess } from '../utils/response';

export class AlertController {
  private alertService: AlertService;

  constructor(alertService = new AlertService()) {
    this.alertService = alertService;
  }

  getAlerts = async (req: Request, res: Response): Promise<void> => {
    const filters = {
      category: req.query.category ? String(req.query.category) : undefined,
      severity: req.query.severity ? String(req.query.severity) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
    };

    const result = await this.alertService.getAlerts(filters);
    sendSuccess(res, result, undefined, 'Alert warnings list retrieved successfully');
  };

  getLiveAlerts = async (req: Request, res: Response): Promise<void> => {
    const spatialParams = {
      lat: req.query.lat ? Number(req.query.lat) : undefined,
      lon: req.query.lon ? Number(req.query.lon) : undefined,
      radius: req.query.radius ? Number(req.query.radius) : undefined,
      minLon: req.query.minLon ? Number(req.query.minLon) : undefined,
      minLat: req.query.minLat ? Number(req.query.minLat) : undefined,
      maxLon: req.query.maxLon ? Number(req.query.maxLon) : undefined,
      maxLat: req.query.maxLat ? Number(req.query.maxLat) : undefined,
    };

    const alerts = await this.alertService.getLiveAlerts(spatialParams);
    sendSuccess(res, alerts, undefined, 'Active coordinates geo-fenced warnings retrieved successfully');
  };

  getAlertById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const alert = await this.alertService.getAlertById(id);
    sendSuccess(res, alert, undefined, 'Alert warning details retrieved successfully');
  };

  getAlertHistory = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const history = await this.alertService.getAlertHistory(id);
    sendSuccess(res, history, undefined, 'Alert revisions logs history retrieved successfully');
  };

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.alertService.getSummary();
    sendSuccess(res, summary, undefined, 'Active warnings statistical counts summary compiled');
  };
}

export default AlertController;
