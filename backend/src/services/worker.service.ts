import { Worker, Job } from 'bullmq';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import DeliveryService from './delivery.service';
import Redis from 'ioredis';

export class WorkerService {
  private workers: Worker[] = [];
  private deliveryService: DeliveryService;
  private redisConnection: Redis | null = null;

  constructor(deliveryService = new DeliveryService()) {
    this.deliveryService = deliveryService;
  }

  startWorkers(): void {
    logger.info('Initializing BullMQ workers for priority notification dispatch...');
    if (process.env.NODE_ENV === 'test') {
      logger.info('Workers bypassed in testing mode.');
      return;
    }

    try {
      this.redisConnection = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
      });

      this.redisConnection.on('error', (err) => {
        logger.error('Worker Redis Connection Error:', err);
      });

      const queueNames = ['high-priority', 'normal-priority', 'low-priority'];

      for (const queueName of queueNames) {
        const worker = new Worker(
          queueName,
          async (job: Job) => {
            logger.info(`Worker processing job [${job.id}] from queue [${queueName}]`);
            const { deliveryId, channel, recipient, payload } = job.data;
            if (!deliveryId || !channel || !recipient || !payload) {
              throw new Error('Invalid job payload: missing parameters');
            }
            const success = await this.deliveryService.deliver(
              deliveryId,
              channel,
              recipient,
              payload
            );
            if (!success) {
              throw new Error(`Delivery service returned failure for delivery ID: ${deliveryId}`);
            }
            logger.info(`Job [${job.id}] completed successfully.`);
          },
          {
            connection: this.redisConnection,
            concurrency: 5,
          }
        );

        worker.on('failed', (job: Job | undefined, err: Error) => {
          logger.error(`Job failed in queue [${queueName}] with error: ${err.message}`, {
            jobId: job?.id,
          });
        });

        this.workers.push(worker);
      }
      logger.info(`Successfully started ${this.workers.length} BullMQ queue workers.`);
    } catch (err: any) {
      logger.error('Failed starting BullMQ worker services:', err);
    }
  }

  async stopWorkers(): Promise<void> {
    logger.info('Shutting down all BullMQ workers...');
    for (const worker of this.workers) {
      await worker.close();
    }
    this.workers = [];
    if (this.redisConnection) {
      await this.redisConnection.quit();
      this.redisConnection = null;
    }
    logger.info('BullMQ workers shut down successfully.');
  }
}

export default WorkerService;
