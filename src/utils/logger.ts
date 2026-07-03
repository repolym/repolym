/**
 * Production-grade logging utility
 * Handles errors, warnings, and debug information with proper context
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  timestamp: string
  level: LogLevel
  message: string
  error?: Error | unknown
  context?: Record<string, unknown>
  stack?: string
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development'

  private formatLog(entry: LogContext): string {
    return `[${entry.timestamp}] ${entry.level}: ${entry.message}${
      entry.error ? `\n${this.formatError(entry.error)}` : ''
    }${entry.context ? `\nContext: ${JSON.stringify(entry.context)}` : ''}`
  }

  private formatError(error: Error | unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack || ''}`
    }
    return String(error)
  }

  private log(level: LogLevel, message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    const entry: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error,
      context,
    }

    const formatted = this.formatLog(entry)

    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
          console.error(formatted)
          break
      }
    } else {
      // In production, send to external service
      this.sendToService(entry)
    }
  }

  private sendToService(entry: LogContext) {
    // Implement error tracking service integration (Sentry, etc.)
    // For now, just log to console in production
    if (entry.level === LogLevel.ERROR) {
      console.error(entry.message, entry.error)
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, undefined, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, undefined, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, undefined, context)
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, error, context)
  }
}

export const logger = new Logger()