import { Request, Response } from 'express';
import NotificationService from '../services/notification.service';
import PreferenceService from '../services/preference.service';
import { sendSuccess } from '../utils/response';
import { AuthenticationError } from '../utils/errors';
import { HTTP_STATUS } from '../constants';

export class NotificationController {
  private notificationService: NotificationService;
  private preferenceService: PreferenceService;

  constructor(
    notificationService = new NotificationService(),
    preferenceService = new PreferenceService()
  ) {
    this.notificationService = notificationService;
    this.preferenceService = preferenceService;
  }

  sendNotification = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const targetUserId = req.body.userId || req.user.id;
    const notification = await this.notificationService.sendNotification(targetUserId, req.body);
    sendSuccess(res, notification, undefined, 'Notification triggered and queued successfully', HTTP_STATUS.CREATED);
  };

  broadcast = async (req: Request, res: Response): Promise<void> => {
    const summary = await this.notificationService.broadcast(req.body);
    sendSuccess(res, summary, undefined, 'Broadcast notifications successfully dispatched');
  };

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const list = await this.notificationService.getUserNotifications(req.user.id);
    sendSuccess(res, list, undefined, 'User notifications list retrieved');
  };

  getNotificationById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const details = await this.notificationService.getNotificationById(id);
    sendSuccess(res, details, undefined, 'Notification details compiled');
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const updated = await this.notificationService.markAsRead(id);
    sendSuccess(res, updated, undefined, 'Notification marked as read');
  };

  getPreferences = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const preferences = await this.preferenceService.getPreferences(req.user.id);
    sendSuccess(res, preferences, undefined, 'User notification preference settings retrieved');
  };

  updatePreferences = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const updated = await this.preferenceService.updatePreferences(req.user.id, req.body.preferences);
    sendSuccess(res, updated, undefined, 'Notification preferences updated successfully');
  };

  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication context is missing.');
    }
    const unread = await this.notificationService.getUnreadCount(req.user.id);
    sendSuccess(res, { unreadCount: unread }, undefined, 'User unread notifications count retrieved');
  };
}

export default NotificationController;
