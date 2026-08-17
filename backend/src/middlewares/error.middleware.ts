import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';
import { BaseError, InternalServerError } from '../utils/errors';
import { sendError } from '../utils/response';
import { env } from '../config/env.config';
import { HTTP_STATUS } from '../constants';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`Error processed on request ${req.id || 'N/A'}: ${error.message}`, {
    requestId: req.id,
    stack: error.stack,
  });

  if (error instanceof BaseError) {
    sendError(res, error, error.statusCode);
    return;
  }

  // Handle default unhandled exceptions
  const responseError = new InternalServerError(
    env.NODE_ENV === 'production' ? 'Internal server error occurred' : error.message
  );

  sendError(res, responseError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const error = new BaseError(
    `Route ${req.method} ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND,
    'ROUTE_NOT_FOUND'
  );
  sendError(res, error, HTTP_STATUS.NOT_FOUND);
};
