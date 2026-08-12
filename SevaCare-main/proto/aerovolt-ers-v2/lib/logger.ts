/**
 * Core Deterministic Error Logger
 * Ensures zero silent failures across the backend pipeline.
 * Every error generates a traceable ID for future bug solving.
 */

export type ErrorSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  logId: string;
  timestamp: string;
  severity: ErrorSeverity;
  context: string;
  message: string;
  stack?: string;
  payload?: any;
}

class BackendLogger {
  private generateLogId(): string {
    return 'ERR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  private formatLog(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.severity}] [${entry.logId}] [${entry.context}]: ${entry.message}`;
  }

  public log(severity: ErrorSeverity, context: string, error: unknown, payload?: any): LogEntry {
    const timestamp = new Date().toISOString();
    const logId = this.generateLogId();
    
    let message = 'Unknown Error';
    let stack = undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = JSON.stringify(error);
    }

    const entry: LogEntry = {
      logId,
      timestamp,
      severity,
      context,
      message,
      stack,
      payload
    };

    // Strict Console Output for deterministic debugging
    const logString = this.formatLog(entry);
    
    switch (severity) {
      case 'INFO':
        console.log(logString);
        break;
      case 'WARNING':
        console.warn(logString);
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(logString);
        if (stack) console.error(`Stack Trace: ${stack}`);
        if (payload) console.error(`Payload Data: ${JSON.stringify(payload)}`);
        break;
    }

    // Returning the structured entry allows routes to return the logId to the client
    return entry;
  }

  public info(context: string, message: string, payload?: any) {
    return this.log('INFO', context, message, payload);
  }

  public warn(context: string, error: unknown, payload?: any) {
    return this.log('WARNING', context, error, payload);
  }

  public error(context: string, error: unknown, payload?: any) {
    return this.log('ERROR', context, error, payload);
  }

  public critical(context: string, error: unknown, payload?: any) {
    return this.log('CRITICAL', context, error, payload);
  }
}

export const logger = new BackendLogger();
