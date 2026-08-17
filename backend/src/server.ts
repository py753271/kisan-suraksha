import app from './app';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import SchedulerService from './services/scheduler.service';
import WorkerService from './services/worker.service';
import db from './config/database.config';
import { redis } from './config/redis.config';

const schedulerService = new SchedulerService();
const workerService = new WorkerService();

let schedulerStarted = false;

const server = app.listen(env.PORT, async () => {
  logger.info(`⚡ Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  
  if (env.NODE_ENV !== 'test' && !schedulerStarted) {
    logger.info('Starting services...');
    await schedulerService.startScheduler();
    workerService.startWorkers();
    schedulerStarted = true;
  }
});

const gracefulShutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Shutting down server gracefully...`);
  
  if (schedulerStarted) {
    schedulerService.stopScheduler();
    await workerService.stopWorkers();
    schedulerStarted = false;
  }

  server.close(async () => {
    logger.info('HTTP server closed.');

    if (redis) {
      try {
        await redis.quit();
        logger.info('Redis connection closed.');
      } catch (err: any) {
        logger.error('Error disconnecting Redis:', err);
      }
    }

    try {
      await db.$disconnect();
      logger.info('Prisma connection closed.');
    } catch (err: any) {
      logger.error('Error disconnecting Prisma:', err);
    }

    process.exit(0);
  });

  // Timeout handler to force shut down if active operations hang
  setTimeout(() => {
    logger.error('Force shutting down process after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection Detected:', {
    message: reason.message,
    stack: reason.stack,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception Detected:', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export { server, schedulerService, workerService };
