import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { requestIdentifier, requestLogger } from './middlewares/logging.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { sendSuccess } from './utils/response';

const app: Express = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Tracing and HTTP Logging
app.use(requestIdentifier);
app.use(requestLogger);

// Health Check Endpoints (Kubernetes & Load Balancer support)
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, { status: 'healthy', uptime: process.uptime() }, undefined, 'System health OK');
});

app.get('/health/live', (req: Request, res: Response) => {
  sendSuccess(res, { liveness: 'alive', timestamp: new Date().toISOString() }, undefined, 'Liveness check OK');
});

import db from './config/database.config';
import { checkRedisHealth } from './config/redis.config';
import { logger } from './config/logger.config';
import { HTTP_STATUS } from './constants';

app.get('/health/ready', async (req: Request, res: Response) => {
  let dbHealthy = false;
  let redisHealthy = false;

  try {
    await db.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (err: any) {
    logger.error('Readiness probe failed database check:', err);
  }

  try {
    const status = await checkRedisHealth();
    if (status.status === 'UP') {
      redisHealthy = true;
    }
  } catch (err: any) {
    logger.error('Readiness probe failed Redis check:', err);
  }

  const payload = {
    readiness: dbHealthy && redisHealthy ? 'ready' : 'unready',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'UP' : 'DOWN',
      redis: redisHealthy ? 'UP' : 'DOWN',
    },
  };

  if (dbHealthy && redisHealthy) {
    sendSuccess(res, payload, undefined, 'Readiness check OK');
  } else {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'One or more required infrastructure components are offline.',
      },
      data: payload,
    });
  }
});

// API Router Registry
import apiRouter from './routes';
app.use('/api/v1', apiRouter);

// Test Endpoint for Async Error Propagation
import { asyncHandler } from './utils/async-handler';
import { ValidationError } from './utils/errors';

app.get('/api/v1/test-async-error', asyncHandler(async (_req: Request, _res: Response) => {
  // Simulate an async operation throwing a ValidationError
  throw new ValidationError('Simulated async validation error');
}));

// 404 Route handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
