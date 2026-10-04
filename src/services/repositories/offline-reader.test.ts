import 'fake-indexeddb/auto';
import { z } from 'zod';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readOffline } from './offline-reader';
import { clearLocalDatabase, setLocalValue } from '../local/local-database';
import { useSessionStore } from '../../store/sessionStore';
import { useOfflineStatus } from '../../store/offline-status';
import { AuthorizationError, NetworkError } from '../api/errorMapper';

vi.mock('../storage/preferences', () => ({ getPreference: vi.fn().mockResolvedValue(null), removePreference: vi.fn() }));
const schema = z.object({ title: z.string(), total: z.number() });
const user = (id: string) => ({ id, name: 'Prueba', email: 'test@example.test', roles: [], permissions: [] });
beforeEach(async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  useOfflineStatus.getState().setStatus(false);
  useSessionStore.getState().setSession(user('student-one'));
  await clearLocalDatabase();
});
afterEach(() => { vi.restoreAllMocks(); useOfflineStatus.getState().setStatus(false); });
describe('lecturas offline aisladas', () => {
  it('conserva respuesta y fecha originales al perder conexión', async () => {
    const remote = vi.fn().mockResolvedValue({ title: 'Leer', total: 54 });
    const online = await readOffline('history:1', schema, remote);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const cached = await readOffline('history:1', schema, remote);
    expect(cached).toEqual({ ...online, offline: true });
    expect(remote).toHaveBeenCalledTimes(1);
  });
  it('una página ausente y otra cuenta no acceden a la copia', async () => {
    const remote = vi.fn().mockResolvedValue({ title: 'Leer', total: 54 });
    await readOffline('history:1', schema, remote);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(readOffline('history:2', schema, remote)).rejects.toBeInstanceOf(NetworkError);
    useSessionStore.getState().setSession(user('student-two'));
    await expect(readOffline('history:1', schema, remote)).rejects.toBeInstanceOf(NetworkError);
  });
  it('rechazo de permisos y consultas ajenas no usan caché', async () => {
    const remote = vi.fn().mockResolvedValue({ title: 'Leer', total: 54 });
    await readOffline('history:1', schema, remote);
    remote.mockRejectedValue(new AuthorizationError('revoked'));
    await expect(readOffline('history:1', schema, remote)).rejects.toBeInstanceOf(AuthorizationError);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(readOffline('history:1', schema, remote, false)).rejects.toBeInstanceOf(NetworkError);
  });
  it('rechaza copias vencidas y valores que no cumplen el contrato', async () => {
    const remote = vi.fn();
    await setLocalValue('history:1', JSON.stringify({ version: 1, savedAt: new Date(Date.now() - 86400001).toISOString(), value: { title: 'Leer', total: 1 } }));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(readOffline('history:1', schema, remote)).rejects.toBeInstanceOf(NetworkError);
    await setLocalValue('history:1', JSON.stringify({ version: 1, savedAt: new Date().toISOString(), value: { title: 8 } }));
    await expect(readOffline('history:1', schema, remote)).rejects.toBeInstanceOf(NetworkError);
  });
});
