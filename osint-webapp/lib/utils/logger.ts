/**
 * Logger Utility
 * Structured logging for the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const errorInfo = error
      ? {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        }
      : undefined;

    this.log(LogLevel.ERROR, message, context, errorInfo);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: LogEntry['error']
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && { error }),
    };

    if (this.isDevelopment) {
      this.logToConsole(entry);
    } else {
      this.logToService(entry);
    }
  }

  /**
   * Log to console (development)
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.error || '', entry.context || '');
        break;
    }
  }

  /**
   * Log to external service (production)
   */
  private logToService(entry: LogEntry): void {
    // In production, send logs to a logging service
    // Examples: Sentry, LogRocket, CloudWatch, Datadog, etc.

    // For now, just log to console
    console.log(JSON.stringify(entry));

    // TODO: Implement integration with logging service
    // Example: Sentry
    // if (entry.level === LogLevel.ERROR && entry.error) {
    //   Sentry.captureException(new Error(entry.message));
    // }
  }

  /**
   * Create child logger with context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level, message, additionalContext?, error?) => {
      originalLog(level, message, { ...context, ...additionalContext }, error);
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create logger for specific module
 */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}
