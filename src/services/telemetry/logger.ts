type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

const SENSITIVE_KEY_FRAGMENTS = ['password', 'token', 'cookie', 'authorization', 'secret'];

export const redactEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';
  return `${email[0]}***${email.slice(atIndex)}`;
};

const redactValue = (key: string, value: unknown): unknown => {
  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEY_FRAGMENTS.some(fragment => lowerKey.includes(fragment))) {
    return '[REDACTED]';
  }
  if (lowerKey === 'email' && typeof value === 'string') {
    return redactEmail(value);
  }
  return value;
};

// Exportado para que otros consumidores de redacción (p. ej. services/telemetry/monitoring.ts)
// apliquen exactamente la misma disciplina de PII que el logger, sin duplicar la lista de claves sensibles.
export const redactContext = (context?: LogContext): LogContext | undefined => {
  if (!context) return context;
  return Object.fromEntries(Object.entries(context).map(([key, value]) => [key, redactValue(key, value)]));
};

// Único punto del proyecto autorizado a llamar a console.* — todo lo demás pasa por logger.
const write = (level: LogLevel, message: string, context?: LogContext): void => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;
  const entry = { timestamp: new Date().toISOString(), level, message, ...redactContext(context) };
  const consoleMethod = level === 'debug' ? 'log' : level;
  console[consoleMethod](entry);
};

export const logger = {
  debug: (message: string, context?: LogContext): void => write('debug', message, context),
  info: (message: string, context?: LogContext): void => write('info', message, context),
  warn: (message: string, context?: LogContext): void => write('warn', message, context),
  error: (message: string, context?: LogContext): void => write('error', message, context),
};
