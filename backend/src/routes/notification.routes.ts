import { Router } from 'express';
import NotificationController from '../controllers/notification.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  sendNotificationValidator,
  broadcastNotificationValidator,
  updatePreferencesValidator,
  notificationIdValidator,
} from '../validators/notification.validator';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const controller = new NotificationController();

// Guard notification endpoints behind authenticated context
router.use(authenticate);

router.post('/send', validate(sendNotificationValidator), asyncHandler(controller.sendNotification));
router.post('/broadcast', validate(broadcastNotificationValidator), asyncHandler(controller.broadcast));
router.get('/', asyncHandler(controller.getUserNotifications));
router.get('/preferences', asyncHandler(controller.getPreferences));
router.patch('/preferences', validate(updatePreferencesValidator), asyncHandler(controller.updatePreferences));
router.get('/unread-count', asyncHandler(controller.getUnreadCount));
router.get('/:id', validate(notificationIdValidator), asyncHandler(controller.getNotificationById));
router.patch('/:id/read', validate(notificationIdValidator), asyncHandler(controller.markAsRead));

export default router;
