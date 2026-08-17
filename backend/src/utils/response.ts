import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { SuccessResponse, ErrorResponse } from '../types/response.types';
import { BaseError } from './errors';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: any,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId: res.req.id || 'N/A',
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: Error | BaseError,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): Response => {
  let finalStatusCode = statusCode;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = error.message || 'Internal server error';
  let details: any = undefined;

  if (error instanceof BaseError) {
    finalStatusCode = error.statusCode;
    code = error.code;
    details = error.details;
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
    requestId: res.req.id || 'N/A',
  };

  return res.status(finalStatusCode).json(response);
};
