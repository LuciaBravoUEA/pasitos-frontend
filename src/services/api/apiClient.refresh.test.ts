import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

// Los adapters reales de Axios (xhr/http) son quienes aplican `validateStatus` y deciden si
// resolver o rechazar — un adapter de prueba tiene que imitar eso explícitamente.
const respondWithStatus = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<{ data: unknown; status: number; statusText: string; headers: AxiosHeaders; config: InternalAxiosRequestConfig }> => {
  const response = { data, status, statusText: String(status), headers: new AxiosHeaders(), config };
  const validateStatus = config.validateStatus ?? (() => true);
  if (validateStatus(status)) return Promise.resolve(response);
  return Promise.reject(
    Object.assign(new Error(`Request failed with status code ${status}`), {
      isAxiosError: true,
      response,
      config,
      code: undefined,
    }),
  );
};

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}));

vi.mock('../storage/secureToken', () => ({
  getSessionToken: vi.fn().mockResolvedValue('expired-token'),
  setSessionToken: vi.fn().mockResolvedValue(undefined),
  clearSessionToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./endpoints/auth', () => ({
  refreshSession: vi.fn().mockResolvedValue({ sessionToken: 'renewed-token', expiresAt: '2030-01-01T00:00:00.000Z' }),
}));

// Prueba del recorrido completo pedido por el enunciado: se fuerza la expiración del token
// (primer intento responde 401) y se verifica que el interceptor de renovación de apiClient.ts
// obtiene un token nuevo y reintenta la petición original UNA sola vez, sin bucle.
describe('apiClient — renovación de sesión ante 401', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renueva el token y reintenta la petición original tras un 401', async () => {
    const { setSessionToken } = await import('../storage/secureToken');
    const { refreshSession } = await import('./endpoints/auth');
    const { apiClient } = await import('./apiClient');

    let callCount = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      callCount += 1;
      if (callCount === 1) {
        return respondWithStatus(config, 401, { error: { code: 'UNAUTHORIZED', message: 'Token expirado' } });
      }
      return respondWithStatus(config, 200, { data: { id: '1' } });
    };

    const response = await apiClient.get('/rutinas/1');

    expect(response.status).toBe(200);
    expect(callCount).toBe(2);
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(setSessionToken).toHaveBeenCalledWith('renewed-token');
  });

  it('no reintenta en bucle si la renovación tampoco resuelve el 401', async () => {
    vi.doMock('./endpoints/auth', () => ({
      refreshSession: vi.fn().mockResolvedValue(null),
    }));
    const { apiClient } = await import('./apiClient');

    let callCount = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      callCount += 1;
      return respondWithStatus(config, 401, { error: { code: 'UNAUTHORIZED', message: 'Token expirado' } });
    };

    await expect(apiClient.get('/rutinas/1')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    // Una petición original + un único retry marcado con _retry — nunca un tercer intento.
    expect(callCount).toBe(2);
  });

  it('envía el Bearer cifrado al endpoint de renovación', async () => {
    const { apiClient } = await import('./apiClient');
    let authorization: string | undefined;
    apiClient.defaults.adapter = async config => {
      authorization = config.headers.get('Authorization')?.toString();
      return respondWithStatus(config, 204, undefined);
    };

    await apiClient.post('/auth/refresh');

    expect(authorization).toBe('Bearer expired-token');
  });
});
