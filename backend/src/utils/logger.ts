const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apikey', 'pan', 'accountnumber', 'authorization'];

/**
 * Masks sensitive keys inside objects before logging to stdout or file
 */
export function maskSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item));
  }

  const masked: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      masked[key] = '[REDACTED_SECRET]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      masked[key] = maskSensitiveData(obj[key]);
    } else {
      masked[key] = obj[key];
    }
  }

  return masked;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context: maskSensitiveData(context) } : {})
    };
    return JSON.stringify(payload);
  }

  public info(message: string, context?: Record<string, any>): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  public warn(message: string, context?: Record<string, any>): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  public error(message: string, context?: Record<string, any>): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();
