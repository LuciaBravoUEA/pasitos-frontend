import { getSessionGeneration } from '../auth/session-generation';
import { Capacitor } from '@capacitor/core';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config/env';
import { useSessionStore } from '../../store/sessionStore';
import { clearSessionToken, getSessionToken, setSessionToken } from '../storage/secureToken';
import type { ApiErrorBody } from '../../types/api/common';
import { logger } from '../telemetry/logger';
import { captureMonitoringError } from '../telemetry/monitoring';
import { coordinateRefresh } from './refreshCoordinator';
import { AuthenticationError, mapApiError } from './errorMapper';
import { clearLocalDatabase } from '../local/local-database';

// Config internas que Axios no tipa por defecto — usadas para: anti-bucle de renovación (401),
// marca de tiempo para medir duración en el log de dev, y contador de reintentos idempotentes.
interface ExtendedRequestConfig extends InternalAxiosRequestConfig {
  _sessionGeneration?: number;
  _retry?: boolean;
  _retryCount?: number;
  _requestStartedAt?: number;
}

const REFRESH_URL = '/auth/refresh';
const RETRYABLE_BACKOFF_MS = [500, 1500];

// withCredentials solo en web: la sesión vive en una cookie HttpOnly (ver tech-stack.md §6).
// En nativo el backend responde con CORS abierto (Access-Control-Allow-Origin: "*") porque no
// hay credenciales de cookie que proteger — pero un origen "*" es incompatible con
// withCredentials: true (el navegador rechaza la combinación), así que en nativo va en false;
// la sesión ahí viaja como Authorization: Bearer, no como cookie.
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: !Capacitor.isNativePlatform(),
  // Únicamente 2xx se resuelve como éxito: 4xx/5xx caen en el interceptor de error de abajo y
  // se traducen a las clases de errorMapper.ts — nunca llegan a un catch genérico sin mapear.
  validateStatus: status => status >= 200 && status < 300,
});

const redactHeaders = (headers: unknown): Record<string, unknown> => {
  const plain = { ...(headers as Record<string, unknown>) };
  if ('Authorization' in plain) plain.Authorization = '[REDACTED]';
  if ('authorization' in plain) plain.authorization = '[REDACTED]';
  return plain;
};

// Interceptor único de request: se combinan correlación + inyección de token + log de dev en
// una sola función a propósito. Axios ejecuta los interceptors de *request* en orden LIFO
// (el último `.use()` registrado corre primero), lo cual es ambiguo si se reparten en varias
// llamadas — con una única función el orden real es el que dicta el código, no el registro.
// Ver spec/features/010-cliente-http-datos-chatbot/plan.md §1.
apiClient.interceptors.request.use(async config => {
  const extended = config as ExtendedRequestConfig;
  if (extended._sessionGeneration !== undefined && extended._sessionGeneration !== getSessionGeneration()) throw new axios.CanceledError('Sesión anterior');
  extended._sessionGeneration = getSessionGeneration();
  extended._requestStartedAt = Date.now();
  config.headers.set('X-Correlation-ID', crypto.randomUUID());

  // En nativo no hay cookie utilizable (feature 003): el token de sesión viaja como Bearer,
  // leído de storage cifrado (Semana 12). En web no se toca — sigue siendo cookie pura (feature 002).
  if (Capacitor.isNativePlatform()) {
    const sessionToken = await getSessionToken();
    if (sessionToken) {
      config.headers.set('Authorization', `Bearer ${sessionToken}`);
    }
  }

  if (env.isDevelopment) {
    logger.debug('→ petición HTTP', {
      method: config.method,
      url: config.url,
      headers: redactHeaders(config.headers),
    });
  }

  return config;
});

// Interceptors de *response* — aquí sí importa el orden de `.use()` porque Axios los ejecuta en
// orden FIFO (el primero registrado corre primero), a diferencia de los de request.

// 1) Logging (dev-only), siempre corre antes de la lógica de renovación/errores para que quede
// registrada la respuesta cruda (redactando encabezados sensibles) tanto en éxito como en error.
apiClient.interceptors.response.use(
  response => {
    if (env.isDevelopment) {
      const startedAt = (response.config as ExtendedRequestConfig)._requestStartedAt;
      logger.debug('← respuesta HTTP', {
        method: response.config.method,
        url: response.config.url,
        status: response.status,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
      });
    }
    return response;
  },
  (error: AxiosError<ApiErrorBody>) => {
    if (env.isDevelopment) {
      const startedAt = (error.config as ExtendedRequestConfig | undefined)?._requestStartedAt;
      logger.debug('← respuesta HTTP (error)', {
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
      });
    }
    return Promise.reject(error);
  },
);

// 2) Renovación de sesión (401) + reintento idempotente (GET) + mapeo de errores de dominio.
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiErrorBody>) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const config = error.config as ExtendedRequestConfig | undefined;
    const isObsolete = () => config?._sessionGeneration !== undefined && config._sessionGeneration !== getSessionGeneration();
    if (isObsolete()) return Promise.reject(new axios.CanceledError('Sesión anterior'));
    const isCredentialCall = config?.url === '/auth/mobile/login' || config?.url === '/auth/mobile/register';

    // Reintento con espera creciente SOLO para GET (idempotente) ante fallos de red/timeout —
    // nunca para POST/PATCH/DELETE, que podrían duplicar un efecto en el servidor.
    if (config && config.method?.toLowerCase() === 'get' && !error.response) {
      const isNetworkOrTimeout = error.code === 'ECONNABORTED' || !error.response;
      const retryCount = config._retryCount ?? 0;
      if (isNetworkOrTimeout && retryCount < RETRYABLE_BACKOFF_MS.length) {
        config._retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, RETRYABLE_BACKOFF_MS[retryCount]));
        return apiClient(config);
      }
    }

    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = config?.url === REFRESH_URL;

    // Bandera anti-bucle: una petición ya reintentada tras renovar no vuelve a disparar otra
    // renovación, aunque el 401 persista (token realmente inválido, no solo expirado).
    if (isUnauthorized && !isRefreshCall && !isCredentialCall && config && !config._retry) {
      config._retry = true;
      try {
        await coordinateRefresh(async () => {
          const refreshed = await refreshSessionAndPersist(config._sessionGeneration);
          if (!refreshed) {
            // Backend respondió 204 (sin token rotado) — se asume que la sesión cookie/existente
            // sigue vigente y se deja que el reintento de abajo confirme si el 401 persiste.
            return;
          }
        });
        return apiClient(config);
      } catch {
        // La renovación misma fanó (401/expirada de verdad): cae al manejo de error normal.
      }
    }

    if (isObsolete()) return Promise.reject(new axios.CanceledError('Sesión anterior'));
    const mappedError = mapApiError(error);
    logger.error('Solicitud a la API falló', {
      code: mappedError.code,
      httpStatus: mappedError.httpStatus,
      url: config?.url,
      method: config?.method,
    });
    // Solo se envían campos ya redactados (nunca el error de Axios crudo, que podría llevar
    // el header Authorization) — ver services/telemetry/monitoring.ts.
    captureMonitoringError(mappedError, { code: mappedError.code, httpStatus: mappedError.httpStatus, url: config?.url, method: config?.method });

    if (mappedError instanceof AuthenticationError && !isCredentialCall) {
      useSessionStore.getState().clearSession();
      if (Capacitor.isNativePlatform()) {
        await clearSessionToken();
      }
      await clearLocalDatabase().catch(() => logger.warn('No se pudo limpiar la caché de la sesión vencida'));
    }

    return Promise.reject(mappedError);
  },
);

// Import diferido (evita ciclo apiClient ↔ endpoints/auth): se resuelve dinámicamente solo
// cuando realmente hay un 401 que renovar.
const refreshSessionAndPersist = async (generation: number | undefined): Promise<boolean> => {
  const { refreshSession } = await import('./endpoints/auth');
  const rotated = await refreshSession();
  if (generation !== getSessionGeneration()) throw new axios.CanceledError('Sesión anterior');
  if (rotated && Capacitor.isNativePlatform()) {
    await setSessionToken(rotated.sessionToken);
    return true;
  }
  return false;
};
