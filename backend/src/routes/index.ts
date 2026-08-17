import { Router } from 'express';
import authRoutes from './auth.routes';
import weatherRoutes from './weather.routes';
import alertRoutes from './alert.routes';
import mapRoutes from './map.routes';
import cropRoutes from './crop.routes';
import emergencyRoutes from './emergency.routes';
import notificationRoutes from './notification.routes';
import integrationRoutes from './integration.routes';
import dashboardRoutes from './dashboard.routes';
import predictionRoutes from './prediction.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/alerts', alertRoutes);
router.use('/map', mapRoutes);
router.use('/crop-advisory', cropRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/integrations', integrationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/predictions', predictionRoutes);

export default router;
