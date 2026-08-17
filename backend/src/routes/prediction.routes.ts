import { Router } from 'express';
import PredictionController from '../controllers/prediction.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  predictionRequestValidator,
  generatePredictionValidator,
} from '../validators/prediction.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new PredictionController();

// Guard AI prediction endpoints behind authenticated contexts
router.use(authenticate);

router.get('/weather', validate(predictionRequestValidator), asyncHandler(controller.getWeatherPredictions));
router.get('/risk', validate(predictionRequestValidator), asyncHandler(controller.getRiskPredictions));
router.get('/crops', validate(predictionRequestValidator), asyncHandler(controller.getCropPredictions));
router.get('/history', asyncHandler(controller.getPredictionHistory));
router.post('/generate', validate(generatePredictionValidator), asyncHandler(controller.generatePrediction));

export default router;
