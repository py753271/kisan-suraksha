import { Router } from 'express';
import AlertController from '../controllers/alert.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  alertListValidator,
  alertLiveQueryValidator,
  alertIdValidator,
} from '../validators/alert.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new AlertController();

// Secure alerts segments behind authenticated context
router.use(authenticate);

router.get('/', validate(alertListValidator), asyncHandler(controller.getAlerts));
router.get('/live', validate(alertLiveQueryValidator), asyncHandler(controller.getLiveAlerts));
router.get('/summary', asyncHandler(controller.getSummary));
router.get('/:id', validate(alertIdValidator), asyncHandler(controller.getAlertById));
router.get('/:id/history', validate(alertIdValidator), asyncHandler(controller.getAlertHistory));

export default router;
