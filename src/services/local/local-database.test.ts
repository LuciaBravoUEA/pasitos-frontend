import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalDatabase, getLocalValue, setLocalValue, updateLocalValue } from './local-database';
import { getPreference, removePreference } from '../storage/preferences';
import { useSessionStore } from '../../store/sessionStore';
import { enqueueRoutineCreation, listOutboxEntries } from './outboxQueue';

vi.mock('../storage/preferences', () => ({ getPreference: vi.fn(), removePreference: vi.fn() }));
const user = (id: string) => ({ id, name: 'Prueba', email: 'prueba@example.test', roles: [], permissions: [] });

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(getPreference).mockResolvedValue(null);
  vi.mocked(removePreference).mockResolvedValue(undefined);
  useSessionStore.getState().setSession(user('one'));
  await clearLocalDatabase();
});

describe('base local y migración', () => {
  it('migra el dato previo y elimina Preferences solo después de poder leer la copia', async () => {
    vi.mocked(getPreference).mockResolvedValueOnce('dato anterior');
    vi.mocked(removePreference).mockImplementationOnce(async key => {
      expect(await getLocalValue(key)).toBe('dato anterior');
    });
    expect(await getLocalValue('legacy')).toBe('dato anterior');
    expect(removePreference).toHaveBeenCalledWith('legacy');
  });

  it('mantiene la copia anterior si falla la transacción de migración', async () => {
    vi.mocked(getPreference).mockResolvedValueOnce('conservar');
    const original = IDBDatabase.prototype.transaction;
    const spy = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, stores, mode) {
      if (mode === 'readwrite') throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, stores, mode);
    });
    await expect(getLocalValue('legacy')).rejects.toThrow();
    expect(removePreference).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('serializa modificaciones concurrentes sin perder operaciones', async () => {
    await setLocalValue('counter', '0');
    await Promise.all(Array.from({ length: 10 }, () => updateLocalValue('counter', value => String(Number(value) + 1))));
    expect(await getLocalValue('counter')).toBe('10');
  });

  it('separa cuentas y permite borrar la base al cerrar sesión', async () => {
    await setLocalValue('cache', 'usuario uno');
    useSessionStore.getState().setSession(user('two'));
    expect(await getLocalValue('cache')).toBeNull();
    await clearLocalDatabase();
    useSessionStore.getState().setSession(user('one'));
    expect(await getLocalValue('cache')).toBeNull();
  });

  it('conserva creaciones concurrentes y su intención de recordatorio', async () => {
    const at = '2027-01-01T09:00:00.000Z';
    await Promise.all(Array.from({ length: 5 }, (_, i) => enqueueRoutineCreation({ title: `Rutina ${i}`, category: 'HOGAR', points: 1 }, at)));
    const entries = await listOutboxEntries();
    expect(entries).toHaveLength(5);
    expect(entries.every(entry => entry.reminderAt === at)).toBe(true);
  });
});
