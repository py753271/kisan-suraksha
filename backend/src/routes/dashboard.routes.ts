import { Router } from 'express';
import DashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new DashboardController();

// Guard dashboard endpoints behind authenticated contexts
router.use(authenticate);

router.get('/overview', asyncHandler(controller.getOverview));
router.get('/weather', asyncHandler(controller.getWeather));
router.get('/alerts', asyncHandler(controller.getAlerts));
router.get('/gis', asyncHandler(controller.getGIS));
router.get('/crops', asyncHandler(controller.getCrops));
router.get('/emergency', asyncHandler(controller.getEmergency));
router.get('/notifications', asyncHandler(controller.getNotifications));
router.get('/integrations', asyncHandler(controller.getIntegrations));
router.get('/system', asyncHandler(controller.getSystem));
router.get('/reports', asyncHandler(controller.getReports));
router.post('/reports', asyncHandler(controller.triggerReport));

export default router;
