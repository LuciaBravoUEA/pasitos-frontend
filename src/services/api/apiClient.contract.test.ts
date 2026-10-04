import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

// Doble del transporte HTTP: sustituye el adapter real de Axios (xhr/http) por uno controlado
// en el test, igual que apiClient.refresh.test.ts — pero aquí se cubren los otros tres casos
// pedidos ("200, 401 con renovación —ya cubierto en apiClient.refresh.test.ts—, 422 y timeout").
const respondWithStatus = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<{ data: unknown; status: number; statusText: string; headers: AxiosHeaders; config: InternalAxiosRequestConfig }> => {
  const response = { data, status, statusText: String(status), headers: new AxiosHeaders(), config };
  const validateStatus = config.validateStatus ?? (() => true);
  if (validateStatus(status)) return Promise.resolve(response);
  return Promise.reject(
    Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response, config, code: undefined }),
  );
};

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

describe('apiClient — contrato de transporte (doble)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('200: resuelve la respuesta tal cual la entrega el transporte', async () => {
    const { apiClient } = await import('./apiClient');
    apiClient.defaults.adapter = async config => respondWithStatus(config, 200, { data: { id: 'routine-1' } });

    const response = await apiClient.get('/rutinas/routine-1');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ data: { id: 'routine-1' } });
  });

  it('422: se traduce a ValidationError conservando los detalles por campo', async () => {
    const { apiClient } = await import('./apiClient');
    const { ValidationError } = await import('./errorMapper');
    apiClient.defaults.adapter = async config =>
      respondWithStatus(config, 422, { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: [{ field: 'title', message: 'Es obligatorio' }] } });

    await expect(apiClient.post('/rutinas', { title: '' })).rejects.toBeInstanceOf(ValidationError);
    await expect(apiClient.post('/rutinas', { title: '' })).rejects.toMatchObject({
      httpStatus: 422,
      details: [{ field: 'title', message: 'Es obligatorio' }],
    });
  });

  it('tiempo de espera agotado: se traduce a TimeoutError sin reintentar en una mutación', async () => {
    const { apiClient } = await import('./apiClient');
    const { TimeoutError } = await import('./errorMapper');
    let callCount = 0;
    apiClient.defaults.adapter = async config => {
      callCount += 1;
      return Promise.reject(Object.assign(new Error('timeout of 15000ms exceeded'), { isAxiosError: true, code: 'ECONNABORTED', config }));
    };

    await expect(apiClient.post('/rutinas', { title: 'Leer' })).rejects.toBeInstanceOf(TimeoutError);
    expect(callCount).toBe(1);
  });

  it('tiempo de espera agotado en GET: reintenta con espera creciente antes de fallar', async () => {
    const { apiClient } = await import('./apiClient');
    const { TimeoutError } = await import('./errorMapper');
    let callCount = 0;
    apiClient.defaults.adapter = async config => {
      callCount += 1;
      return Promise.reject(Object.assign(new Error('timeout of 15000ms exceeded'), { isAxiosError: true, code: 'ECONNABORTED', config }));
    };

    await expect(apiClient.get('/rutinas/routine-1')).rejects.toBeInstanceOf(TimeoutError);
    // Petición original + 2 reintentos con backoff (ver RETRYABLE_BACKOFF_MS en apiClient.ts).
    expect(callCount).toBe(3);
  }, 10000);
});
