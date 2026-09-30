import { Router } from 'express';
import EmergencyController from '../controllers/emergency.controller';
import { validate } from '../middlewares/validation.middleware';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import {
  sosRequestValidator,
  contactsQueryValidator,
  sheltersQueryValidator,
  nearbySheltersValidator,
  resourcesQueryValidator,
  sosIdValidator,
} from '../validators/emergency.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new EmergencyController();

// Support public emergency contacts, shelters, and resources with optional authentication
router.use(optionalAuthenticate);

router.post('/sos', validate(sosRequestValidator), asyncHandler(controller.createSOS));
router.get('/sos', asyncHandler(controller.getSOSRequests));
router.get('/sos/:id', validate(sosIdValidator), asyncHandler(controller.getSOSById));
router.get('/contacts', validate(contactsQueryValidator), asyncHandler(controller.getContacts));
router.get('/shelters', validate(sheltersQueryValidator), asyncHandler(controller.getShelters));
router.get('/shelters/nearby', validate(nearbySheltersValidator), asyncHandler(controller.getNearbyShelters));
router.get('/resources', validate(resourcesQueryValidator), asyncHandler(controller.getResources));

export default router;
