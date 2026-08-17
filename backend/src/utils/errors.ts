import { HTTP_STATUS } from '../constants';

export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, isOperational = true, details?: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed', details?: any) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'AUTHENTICATION_ERROR', true, details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message = 'Not authorized to access this resource', details?: any) {
    super(message, HTTP_STATUS.FORBIDDEN, 'AUTHORIZATION_ERROR', true, details);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = 'Requested resource not found', details?: any) {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND_ERROR', true, details);
  }
}

export class ConflictError extends BaseError {
  constructor(message = 'Conflict occurred', details?: any) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT_ERROR', true, details);
  }
}

export class RateLimitError extends BaseError {
  constructor(message = 'Too many requests, please try again later', details?: any) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_ERROR', true, details);
  }
}

export class ExternalAPIError extends BaseError {
  constructor(message = 'Error communicating with external service', details?: any) {
    super(message, HTTP_STATUS.BAD_GATEWAY, 'EXTERNAL_API_ERROR', true, details);
  }
}

export class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed', details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', true, details);
  }
}

export class InternalServerError extends BaseError {
  constructor(message = 'Internal server error occurred', details?: any) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', false, details);
  }
}
