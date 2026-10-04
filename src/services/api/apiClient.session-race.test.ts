import { AxiosHeaders, isCancel, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('../storage/secureToken', () => ({
  getSessionToken: vi.fn().mockResolvedValue('previous-token'),
  setSessionToken: vi.fn(),
  clearSessionToken: vi.fn(),
}));
vi.mock('./endpoints/auth', () => ({ refreshSession: vi.fn() }));
const unauthorized = (config: InternalAxiosRequestConfig): Promise<never> => Promise.reject(Object.assign(new Error('401'), { config, response: { status: 401, data: { error: { code: 'UNAUTHORIZED', message: 'Sin sesión' } }, headers: new AxiosHeaders(), config } }));
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });

describe('Respuestas de sesiones anteriores', () => {
  it('un 401 antiguo no renueva ni borra la nueva sesión', async () => {
    const { apiClient } = await import('./apiClient');
    const { beginSessionChange } = await import('../auth/session-generation');
    const { clearSessionToken } = await import('../storage/secureToken');
    const { refreshSession } = await import('./endpoints/auth');
    const entered = deferred<void>();
    const release = deferred<void>();
    apiClient.defaults.adapter = async config => { entered.resolve(); await release.promise; return unauthorized(config); };
    const result = apiClient.get('/auth/session').catch(error => error);
    await entered.promise;
    beginSessionChange();
    release.resolve();
    expect(isCancel(await result)).toBe(true);
    expect(refreshSession).not.toHaveBeenCalled();
    expect(clearSessionToken).not.toHaveBeenCalled();
  });
  it('una renovación que falla tarde tampoco borra la nueva sesión', async () => {
    const { apiClient } = await import('./apiClient');
    const { beginSessionChange } = await import('../auth/session-generation');
    const { clearSessionToken } = await import('../storage/secureToken');
    const { refreshSession } = await import('./endpoints/auth');
    const entered = deferred<void>();
    const release = deferred<null>();
    vi.mocked(refreshSession).mockImplementation(async () => { entered.resolve(); return release.promise; });
    apiClient.defaults.adapter = config => unauthorized(config);
    const result = apiClient.get('/auth/session').catch(error => error);
    await entered.promise;
    beginSessionChange();
    release.resolve(null);
    expect(isCancel(await result)).toBe(true);
    expect(clearSessionToken).not.toHaveBeenCalled();
  });
  it('credenciales incorrectas no renuevan ni destruyen una sesión existente', async () => {
    const { apiClient } = await import('./apiClient');
    const { clearSessionToken } = await import('../storage/secureToken');
    const { refreshSession } = await import('./endpoints/auth');
    apiClient.defaults.adapter = config => unauthorized(config);
    await expect(apiClient.post('/auth/mobile/login', { username: 'prueba', password: 'incorrecta' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(refreshSession).not.toHaveBeenCalled();
    expect(clearSessionToken).not.toHaveBeenCalled();
  });
});
