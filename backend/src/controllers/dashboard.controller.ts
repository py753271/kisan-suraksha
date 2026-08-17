import { Request, Response } from 'express';
import DashboardService from '../services/dashboard.service';
import ReportService from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { AuthenticationError } from '../utils/errors';
import { HTTP_STATUS } from '../constants';

export class DashboardController {
  private dashboardService: DashboardService;
  private reportService: ReportService;

  constructor(
    dashboardService = new DashboardService(),
    reportService = new ReportService()
  ) {
    this.dashboardService = dashboardService;
    this.reportService = reportService;
  }

  getOverview = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.dashboardService.getOverview();
    sendSuccess(res, stats, undefined, 'Overview dashboard KPIs compiled');
  };

  getWeather = async (_req: Request, res: Response): Promise<void> => {
    const weather = await this.dashboardService.getWeatherDashboard();
    sendSuccess(res, weather, undefined, 'Weather analytics and trends compiled');
  };

  getAlerts = async (_req: Request, res: Response): Promise<void> => {
    const alerts = await this.dashboardService.getAlertsDashboard();
    sendSuccess(res, alerts, undefined, 'Disaster early warning alerts metrics compiled');
  };

  getGIS = async (_req: Request, res: Response): Promise<void> => {
    const gis = await this.dashboardService.getGISDashboard();
    sendSuccess(res, gis, undefined, 'GIS mapping overlays count compiled');
  };

  getCrops = async (_req: Request, res: Response): Promise<void> => {
    const crops = await this.dashboardService.getCropsDashboard();
    sendSuccess(res, crops, undefined, 'Crops agricultural advisory analytics compiled');
  };

  getEmergency = async (_req: Request, res: Response): Promise<void> => {
    const emergency = await this.dashboardService.getEmergencyDashboard();
    sendSuccess(res, emergency, undefined, 'Emergency SOS response KPIs compiled');
  };

  getNotifications = async (_req: Request, res: Response): Promise<void> => {
    const notifications = await this.dashboardService.getNotificationsDashboard();
    sendSuccess(res, notifications, undefined, 'Bulk communications dispatch logs statistics compiled');
  };

  getIntegrations = async (_req: Request, res: Response): Promise<void> => {
    const integrations = await this.dashboardService.getIntegrationsDashboard();
    sendSuccess(res, integrations, undefined, 'Government API synchronization metrics compiled');
  };

  getSystem = async (_req: Request, res: Response): Promise<void> => {
    const system = await this.dashboardService.getSystemDashboard();
    sendSuccess(res, system, undefined, 'API response and server health metrics compiled');
  };

  getReports = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit || 10);
    const list = await this.reportService.getReportsList(limit);
    sendSuccess(res, list, undefined, 'Farmers safety reports log compiled');
  };

  triggerReport = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const type = req.body.type || 'DAILY';
    const report = await this.reportService.generateReport(type, req.user.id);
    sendSuccess(res, report, undefined, `Manual report generation compiled for ${type}`, HTTP_STATUS.CREATED);
  };
}

export default DashboardController;
