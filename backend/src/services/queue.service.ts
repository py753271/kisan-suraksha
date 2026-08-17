import { Queue } from 'bullmq';
import { logger } from '../config/logger.config';

export class QueueService {
  private queues: Record<string, Queue | null> = {};

  constructor() {
    // Only construct BullMQ Queues outside of testing environments
    if (process.env.NODE_ENV !== 'test') {
      try {
        const connection = { host: process.env.REDIS_HOST || '127.0.0.1', port: Number(process.env.REDIS_PORT) || 6379 };
        this.queues['High'] = new Queue('high-priority', { connection });
        this.queues['Normal'] = new Queue('normal-priority', { connection });
        this.queues['Low'] = new Queue('low-priority', { connection });
      } catch (_err) {
        logger.warn('Failed to connect to BullMQ Redis Queue server. Falling back to local logging.');
      }
    }
  }

  async addJob(priority: 'High' | 'Normal' | 'Low', data: any): Promise<void> {
    const queue = this.queues[priority];
    if (queue) {
      await queue.add('notification-job', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
      logger.info(`Queued notification in BullMQ with priority ${priority}`);
    } else {
      logger.info(`Bypassed BullMQ (test/fallback mode). Payload: ${JSON.stringify(data)}`);
    }
  }
}

export default QueueService;
