type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function createLogger(level: LogLevel) {
  return (message: string, context?: LogContext) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    const formatted = formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    return entry;
  };
}

export const logger = {
  debug: createLogger('debug'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
};

export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  statusCode?: number,
  durationMs?: number
) {
  logger.info(`API ${method} ${path}`, {
    userId,
    action: 'api_request',
    resource: path,
    metadata: {
      method,
      statusCode,
      durationMs,
    },
  });
}

export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'password_reset',
  userId?: string,
  success: boolean = true
) {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth event: ${event}`, {
    userId,
    action: event,
    metadata: { success },
  });
}

export function logSubscriptionEvent(
  event: 'created' | 'updated' | 'cancelled',
  userId: string,
  plan?: string
) {
  logger.info(`Subscription ${event}`, {
    userId,
    action: `subscription_${event}`,
    metadata: { plan },
  });
}

export function logError(
  error: Error | string,
  context?: LogContext
) {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(message, {
    ...context,
    metadata: {
      ...context?.metadata,
      stack,
    },
  });
}
