import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listRoutines } from './routinesRepository';
import * as remote from '../api/endpoints/routines';
import { clearLocalDatabase } from '../local/local-database';
import { useSessionStore } from '../../store/sessionStore';
import { useOfflineStatus } from '../../store/offline-status';
import { NetworkError } from '../api/errorMapper';

vi.mock('../api/endpoints/routines', () => ({ listRoutines: vi.fn() }));
vi.mock('../storage/preferences', () => ({ getPreference: vi.fn().mockResolvedValue(null), removePreference: vi.fn() }));
beforeEach(async () => {
  vi.clearAllMocks();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  useOfflineStatus.getState().setStatus(false);
  useSessionStore.getState().setSession({ id: 'student', name: 'Prueba', email: 'test@example.test', roles: [], permissions: [] });
  await clearLocalDatabase();
});
afterEach(() => { vi.restoreAllMocks(); useOfflineStatus.getState().setStatus(false); });
describe('paginación de rutinas descargadas', () => {
  it('conserva metadatos reales incluso en una página vacía y distingue una página no descargada', async () => {
    const response = { data: [], meta: { page: 2, pageSize: 10, total: 10, totalPages: 1 } };
    vi.mocked(remote.listRoutines).mockResolvedValue(response);
    expect(await listRoutines(2)).toEqual(response);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(await listRoutines(2)).toEqual(response);
    await expect(listRoutines(3)).rejects.toBeInstanceOf(NetworkError);
    expect(remote.listRoutines).toHaveBeenCalledTimes(1);
  });
});
