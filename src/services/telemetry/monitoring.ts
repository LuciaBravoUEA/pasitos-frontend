import * as Sentry from '@sentry/capacitor';
import * as SentryReact from '@sentry/react';
import { env } from '../../config/env';
import { redactContext } from './logger';

// Monitoreo de fallos (capa gratuita de Sentry). Sin `VITE_SENTRY_DSN` definido, `initMonitoring`
// no hace nada — nunca es un requisito para que la app arranque (ver .env.example).
const HEADER_KEY_FRAGMENTS = ['authorization', 'cookie', 'set-cookie'];

const stripSensitiveHeaders = (headers: unknown): unknown => {
  if (!headers || typeof headers !== 'object') return headers;
  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).map(([key, value]) =>
      HEADER_KEY_FRAGMENTS.some(fragment => key.toLowerCase().includes(fragment)) ? [key, '[REDACTED]'] : [key, value],
    ),
  );
};

let initialized = false;

export const initMonitoring = (): void => {
  if (initialized || !env.monitoringDsn) return;
  initialized = true;
  Sentry.init(
    {
      dsn: env.monitoringDsn,
      environment: env.isProduction ? 'production' : 'development',
      release: env.appVersion,
      // Nunca se envían payloads de red completos: solo lo que este mismo módulo construye,
      // así que no hace falta samplear tracing/replay para cumplir la regla de "sin PII".
      tracesSampleRate: 0,
      beforeSend: event => {
        if (event.request?.headers) event.request.headers = stripSensitiveHeaders(event.request.headers) as Record<string, string>;
        if (event.user?.email) delete event.user.email;
        if (event.user?.username) delete event.user.username;
        return event;
      },
    },
    SentryReact.init,
  );
};

// Identificador interno de sesión (nunca correo/documento) — ver AGENTS.md §6 y tech-stack.md §11.
export const setMonitoringUser = (userId: string): void => {
  if (!initialized) return;
  Sentry.setUser({ id: userId });
};

export const clearMonitoringUser = (): void => {
  if (!initialized) return;
  Sentry.setUser(null);
};

export const captureMonitoringError = (error: unknown, context?: Record<string, unknown>): void => {
  if (!initialized) return;
  Sentry.captureException(error, { extra: redactContext(context) });
};
