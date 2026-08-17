export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
  timestamp: string;
  requestId: string;
}

export interface ErrorDetails {
  message: string;
  code: string;
  details?: any;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetails;
  timestamp: string;
  requestId: string;
}
