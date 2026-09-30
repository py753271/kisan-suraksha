import { Router } from 'express';
import MapController from '../controllers/map.controller';
import { validate } from '../middlewares/validation.middleware';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import {
  layerQueryValidator,
  boundaryQueryValidator,
  shelterQueryValidator,
  reverseGeocodeValidator,
  locationSearchValidator,
} from '../validators/map.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new MapController();

// Public location search (Unauthenticated homepage access)
router.get('/locations/search', validate(locationSearchValidator), asyncHandler(controller.searchLocations));

// Support public map layers, boundaries, shelters, and reverse geocoding
router.use(optionalAuthenticate);

router.get('/layers/:layerName', validate(layerQueryValidator), asyncHandler(controller.getLayer));
router.get('/boundaries/:type', validate(boundaryQueryValidator), asyncHandler(controller.getBoundary));
router.get('/shelters/nearest', validate(shelterQueryValidator), asyncHandler(controller.getNearestShelters));
router.get('/geocode/reverse', validate(reverseGeocodeValidator), asyncHandler(controller.reverseGeocode));

export default router;
