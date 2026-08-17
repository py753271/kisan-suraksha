import { logger } from '../config/logger.config';
import db from '../config/database.config';

export class DeliveryService {
  async deliver(deliveryId: string, channel: string, recipient: string, payload: { title: string; body: string }): Promise<boolean> {
    logger.info(`Initiating delivery [${deliveryId}] via ${channel} to ${recipient}`);

    // Update status to processing
    await db.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: 'Processing' },
    });

    let success = false;
    try {
      // Mock providers dispatch
      switch (channel) {
        case 'Push':
          logger.info(`[FCM Mock] Sent push notification: "${payload.title}" to device: ${recipient}`);
          success = true;
          break;
        case 'SMS':
          logger.info(`[Twilio Mock] Sent SMS: "${payload.body}" to phone: ${recipient}`);
          success = true;
          break;
        case 'Email':
          logger.info(`[Nodemailer Mock] Sent email: "${payload.title}" to: ${recipient}`);
          success = true;
          break;
        case 'WhatsApp':
          logger.info(`[Meta API Mock] Sent WhatsApp message: "${payload.body}" to: ${recipient}`);
          success = true;
          break;
        default:
          logger.warn(`Unknown delivery channel: ${channel}`);
      }
    } catch (err: any) {
      logger.error(`Delivery attempt failed for ID: ${deliveryId}. Error: ${err.message}`);
    }

    const status = success ? 'Sent' : 'Failed';
    const errorMsg = success ? null : 'Provider dispatch error';

    await db.$transaction(async (tx: any) => {
      await tx.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status,
          sentAt: success ? new Date() : null,
          deliveredAt: success ? new Date() : null,
          errorMessage: errorMsg,
        },
      });

      await tx.notificationLog.create({
        data: {
          deliveryId,
          status,
          logMessage: success
            ? `Successfully dispatched notification via ${channel}`
            : `Failed dispatching notification via ${channel}: ${errorMsg}`,
        },
      });
    });

    return success;
  }
}

export default DeliveryService;
