import { Router } from 'express';
import IntegrationController from '../controllers/integration.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  syncRequestValidator,
  retrySyncValidator,
} from '../validators/integration.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new IntegrationController();

// Guard integration endpoints behind authenticated user contexts
router.use(authenticate);

router.get('/providers', asyncHandler(controller.getProviders));
router.get('/status', asyncHandler(controller.getStatus));
router.get('/health', asyncHandler(controller.getHealth));
router.get('/sync-history', asyncHandler(controller.getSyncHistory));
router.post('/sync', asyncHandler(controller.syncAllProviders));
router.post('/sync/:provider', validate(syncRequestValidator), asyncHandler(controller.syncProvider));
router.post('/retry/:syncId', validate(retrySyncValidator), asyncHandler(controller.retrySync));

export default router;
