/**
 * Custom API error class for error handling
 */
export class ApiError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error class
 */
export class AuthError extends ApiError {
  public source?: string;
  public details?: Record<string, any>;
  
  constructor(message: string = 'Authentication failed', source?: string, details?: Record<string, any>) {
    super(message, 401);
    this.name = 'AuthError';
    this.source = source;
    this.details = details;
  }
}

/**
 * Authorization error class
 */
export class ForbiddenError extends ApiError {
  public source?: string;
  public details?: Record<string, any>;
  
  constructor(message: string = 'Access forbidden', source?: string, details?: Record<string, any>) {
    super(message, 403);
    this.name = 'ForbiddenError';
    this.source = source;
    this.details = details;
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends ApiError {
  public source?: string;
  public details?: Record<string, any>;
  
  constructor(message: string = 'Resource not found', source?: string, details?: Record<string, any>) {
    super(message, 404);
    this.name = 'NotFoundError';
    this.source = source;
    this.details = details;
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ApiError {
  public source?: string;
  public details?: Record<string, any>;
  
  constructor(message: string = 'Validation failed', source?: string, details?: Record<string, any>) {
    super(message, 400);
    this.name = 'ValidationError';
    this.source = source;
    this.details = details;
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends ApiError {
  public source?: string;
  public details?: Record<string, any>;
  
  constructor(message: string = 'Rate limit exceeded', source?: string, details?: Record<string, any>) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.source = source;
    this.details = details;
  }
} 