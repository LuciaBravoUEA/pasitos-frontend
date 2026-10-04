import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as remote from '../api/endpoints/routines';
import { createRoutine, syncOutbox } from './routinesRepository';
import { clearLocalDatabase } from '../local/local-database';
import { listOutboxEntries } from '../local/outboxQueue';
import { listReminderIntents } from '../local/reminder-intents';
import { scheduleRoutineReminder } from '../device/routineReminders';
import { useSessionStore } from '../../store/sessionStore';
import { NetworkError } from '../api/errorMapper';

vi.mock('../api/endpoints/routines', () => ({ createRoutine: vi.fn(), listRoutines: vi.fn(), getRoutine: vi.fn() }));
vi.mock('../storage/preferences', () => ({ getPreference: vi.fn().mockResolvedValue(null), removePreference: vi.fn() }));
vi.mock('../device/routineReminders', () => ({ scheduleRoutineReminder: vi.fn() }));
const request = { title: 'Leer', category: 'HOGAR' as const, points: 1 };
const routine = { ...request, id: 'routine-1', userId: 'user-1', description: null, completed: false, createdAt: '2026-09-20T10:00:00.000Z' };

beforeEach(async () => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession({ id: 'user-1', name: 'Prueba', email: 'prueba@example.test', roles: [], permissions: [] });
  await clearLocalDatabase();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  vi.mocked(remote.createRoutine).mockResolvedValue(routine);
  vi.mocked(scheduleRoutineReminder).mockResolvedValue(undefined);
});

describe('sincronización y capacidades opcionales', () => {
  it('no crea otra rutina si falla el recordatorio; conserva el aviso para reintentar', async () => {
    await createRoutine(request, '2027-01-01T09:00:00.000Z');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(scheduleRoutineReminder).mockRejectedValue(new Error('permission revoked'));
    expect(await syncOutbox()).toEqual({ synced: 1, failed: 0, remindersPending: 1 });
    expect(await listOutboxEntries()).toHaveLength(0);
    expect(await listReminderIntents()).toHaveLength(1);
    vi.mocked(scheduleRoutineReminder).mockResolvedValue(undefined);
    await syncOutbox();
    expect(remote.createRoutine).toHaveBeenCalledTimes(1);
    expect(await listReminderIntents()).toHaveLength(0);
  });

  it('coalesce apertura, reconexión y resume concurrentes', async () => {
    await createRoutine(request);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const first = syncOutbox();
    const second = syncOutbox();
    expect(first).toBe(second);
    await Promise.all([first, second]);
    expect(remote.createRoutine).toHaveBeenCalledTimes(1);
  });

  it('no consume la cola sin sesión o sin conexión', async () => {
    await createRoutine(request);
    await syncOutbox();
    expect(await listOutboxEntries()).toHaveLength(1);
    useSessionStore.getState().clearSession();
    await syncOutbox();
    expect(remote.createRoutine).not.toHaveBeenCalled();
  });

  it('no reenvía automáticamente un POST cuya respuesta se perdió', async () => {
    await createRoutine(request);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    vi.mocked(remote.createRoutine).mockRejectedValue(new NetworkError('respuesta perdida'));
    await syncOutbox();
    expect((await listOutboxEntries())[0].uncertain).toBe(true);
    await syncOutbox();
    expect(remote.createRoutine).toHaveBeenCalledTimes(1);
  });
});
