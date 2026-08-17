import { Router } from 'express';
import MapController from '../controllers/map.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  layerQueryValidator,
  boundaryQueryValidator,
  shelterQueryValidator,
  reverseGeocodeValidator,
} from '../validators/map.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new MapController();

// Guard map endpoints behind authenticated context
router.use(authenticate);

router.get('/layers/:layerName', validate(layerQueryValidator), asyncHandler(controller.getLayer));
router.get('/boundaries/:type', validate(boundaryQueryValidator), asyncHandler(controller.getBoundary));
router.get('/shelters/nearest', validate(shelterQueryValidator), asyncHandler(controller.getNearestShelters));
router.get('/geocode/reverse', validate(reverseGeocodeValidator), asyncHandler(controller.reverseGeocode));

export default router;
