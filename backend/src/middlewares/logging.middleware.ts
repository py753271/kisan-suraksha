import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.config';

export const requestIdentifier = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.headers['user-agent'] || 'unknown';

  logger.info(`Incoming Request: ${method} ${originalUrl} - IP: ${ip} - UA: ${userAgent}`, {
    requestId: req.id,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logger.info(`Outgoing Response: ${method} ${originalUrl} - Status: ${statusCode} - Time: ${duration}ms`, {
      requestId: req.id,
      statusCode,
      duration,
    });
  });

  next();
};
