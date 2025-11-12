/**
 * Error Handling Utilities
 * Custom error classes and error handling functions
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  public readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Tool execution error (500)
 */
export class ToolExecutionError extends AppError {
  public readonly toolName: string;

  constructor(toolName: string, message: string) {
    super(`Tool execution failed: ${message}`, 500);
    this.toolName = toolName;
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

/**
 * External API error (502)
 */
export class ExternalApiError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`External API error (${service}): ${message}`, 502);
    this.service = service;
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    errors?: string[];
    stack?: string;
  };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
  error: Error,
  includeStack: boolean = false
): ErrorResponse {
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
      },
    };

    if (error instanceof ValidationError && error.errors.length > 0) {
      response.error.errors = error.errors;
    }

    if (includeStack && error.stack) {
      response.error.stack = error.stack;
    }

    return response;
  }

  // Unknown error
  return {
    error: {
      message: error.message || 'Internal server error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(includeStack && error.stack ? { stack: error.stack } : {}),
    },
  };
}

/**
 * Handle async errors in API routes
 */
export function asyncHandler<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Safe JSON stringify with error handling
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '[Unable to stringify object]';
  }
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Log error (can be extended with proper logging service)
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...(error instanceof AppError && {
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    }),
    ...context,
  };

  // In production, send to logging service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', safeStringify(errorInfo));
  } else {
    console.error('Error:', errorInfo);
  }
}
