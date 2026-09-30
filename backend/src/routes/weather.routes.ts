import { Router } from 'express';
import WeatherController from '../controllers/weather.controller';
import { validate } from '../middlewares/validation.middleware';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import {
  weatherQueryValidator,
  weatherHistoryValidator,
} from '../validators/weather.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new WeatherController();

// Support public weather queries with optional authentication
router.use(optionalAuthenticate);

router.get('/current', validate(weatherQueryValidator), asyncHandler(controller.getCurrent));
router.get('/hourly', validate(weatherQueryValidator), asyncHandler(controller.getHourly));
router.get('/daily', validate(weatherQueryValidator), asyncHandler(controller.getDaily));
router.get('/history', validate(weatherHistoryValidator), asyncHandler(controller.getHistory));
router.get('/summary', validate(weatherQueryValidator), asyncHandler(controller.getSummary));

export default router;
