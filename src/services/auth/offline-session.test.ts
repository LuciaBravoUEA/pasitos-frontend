import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { resolveSession } from './offline-session';
import { getSession } from '../api/endpoints/auth';
import { getSessionToken, getSecureValue, setSecureValue } from '../storage/secureToken';
import { AuthenticationError, NetworkError } from '../api/errorMapper';
import { useOfflineStatus } from '../../store/offline-status';

vi.mock('../api/endpoints/auth', () => ({ getSession: vi.fn() }));
vi.mock('../storage/secureToken', () => ({ getSessionToken: vi.fn(), getSecureValue: vi.fn(), setSecureValue: vi.fn() }));
const user = { id: 'student', email: 'test@example.test', name: 'Prueba', roles: [], permissions: [], exp: Math.floor(Date.now() / 1000) + 3600 };
let saved: string | null;
beforeEach(() => {
  vi.clearAllMocks();
  saved = null;
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  vi.mocked(getSessionToken).mockResolvedValue('credential-one');
  vi.mocked(getSession).mockResolvedValue(user);
  vi.mocked(getSecureValue).mockImplementation(async () => saved);
  vi.mocked(setSecureValue).mockImplementation(async (_key, value) => { saved = value; });
  useOfflineStatus.getState().setStatus(false);
});
afterEach(() => { vi.restoreAllMocks(); useOfflineStatus.getState().setStatus(false); });

describe('sesión nativa sin conexión', () => {
  it('restaura identidad validada tras una reapertura offline, limitada por expiración real', async () => {
    await resolveSession();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(await resolveSession()).toEqual(user);
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(useOfflineStatus.getState().validatedUntil).toBe(user.exp * 1000);
  });
  it('un fallo de red conserva acceso pero un 401 no usa el snapshot', async () => {
    await resolveSession();
    vi.mocked(getSession).mockRejectedValue(new NetworkError('offline'));
    expect(await resolveSession()).toEqual(user);
    vi.mocked(getSession).mockRejectedValue(new AuthenticationError('revoked'));
    await expect(resolveSession()).rejects.toBeInstanceOf(AuthenticationError);
  });
  it('impide primer acceso offline sin snapshot', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(resolveSession()).rejects.toBeInstanceOf(NetworkError);
  });
  it('no reutiliza identidad de otra credencial', async () => {
    await resolveSession();
    vi.mocked(getSessionToken).mockResolvedValue('credential-two');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(resolveSession()).rejects.toBeInstanceOf(NetworkError);
  });
  it('rechaza snapshots vencidos, corruptos y fechados en el futuro', async () => {
    await resolveSession();
    const valid = saved!;
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    saved = JSON.stringify({ ...JSON.parse(valid), expiresAt: Date.now() - 1 });
    await expect(resolveSession()).rejects.toBeInstanceOf(NetworkError);
    saved = JSON.stringify({ ...JSON.parse(valid), savedAt: Date.now() + 10000 });
    await expect(resolveSession()).rejects.toBeInstanceOf(NetworkError);
    saved = 'broken';
    await expect(resolveSession()).rejects.toBeInstanceOf(NetworkError);
  });
  it('no restaura sesiones en navegador de desarrollo', async () => {
    await resolveSession();
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(resolveSession()).rejects.toBeInstanceOf(NetworkError);
  });
});
