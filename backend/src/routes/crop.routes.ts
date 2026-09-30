import { Router } from 'express';
import CropController from '../controllers/crop.controller';
import { validate } from '../middlewares/validation.middleware';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import {
  advisoryQueryValidator,
  recommendationQueryValidator,
  riskQueryValidator,
  advisoryHistoryQueryValidator,
} from '../validators/crop.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new CropController();

// Support public crop advisories with optional authentication
router.use(optionalAuthenticate);

router.get('/current', validate(advisoryQueryValidator), asyncHandler(controller.getCurrentAdvisories));
router.get('/history', validate(advisoryHistoryQueryValidator), asyncHandler(controller.getAdvisoryHistory));
router.get('/recommendation', validate(recommendationQueryValidator), asyncHandler(controller.getRecommendations));
router.get('/risk', validate(riskQueryValidator), asyncHandler(controller.getRisk));

export default router;
