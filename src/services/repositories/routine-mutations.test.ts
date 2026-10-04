import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as remote from '../api/endpoints/routines';
import { addRoutineTask, createRoutine, deleteRoutine, getRoutine, updateRoutine } from './routinesRepository';
import { clearLocalDatabase } from '../local/local-database';
import { getCachedRoutine, getCachedRoutineList, setCachedRoutine, setCachedRoutineList } from '../local/routinesLocalSource';
import { listOutboxEntries } from '../local/outboxQueue';
import { NotFoundError } from '../api/errorMapper';
import { useSessionStore } from '../../store/sessionStore';

vi.mock('../api/endpoints/routines', () => ({ addRoutineTask: vi.fn(), deleteRoutine: vi.fn(), updateRoutine: vi.fn(), createRoutine: vi.fn(), getRoutine: vi.fn() }));
vi.mock('../storage/preferences', () => ({ getPreference: vi.fn().mockResolvedValue(null), removePreference: vi.fn() }));
vi.mock('../device/notificationPermission', () => ({ isNotificationsCapabilityAvailable: () => false }));
const routine = { id: 'routine-1', userId: 'user-1', title: 'Leer', description: null, category: 'HOGAR' as const, points: 10, completed: false, createdAt: '2026-10-01', tasks: [{ id: 'task-1', title: 'Abrir libro', description: null, position: 0 }] };
beforeEach(async () => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession({ id: 'user-1', name: 'Prueba', email: 'test@example.test', roles: [], permissions: [] });
  await clearLocalDatabase();
  await setCachedRoutine(routine);
  await setCachedRoutineList(1, [routine]);
});
describe('Consistencia de rutinas', () => {
  it('elimina detalle y listado de caché después de borrar la rutina', async () => {
    vi.mocked(remote.deleteRoutine).mockResolvedValue(undefined);
    await deleteRoutine(routine.id);
    expect(await getCachedRoutine(routine.id)).toBeNull();
    expect(await getCachedRoutineList(1)).toBeNull();
  });
  it('no oculta un 404 remoto mostrando una copia antigua', async () => {
    vi.mocked(remote.getRoutine).mockRejectedValue(new NotFoundError('No existe', 404));
    await expect(getRoutine(routine.id)).rejects.toBeInstanceOf(NotFoundError);
  });
  it('actualiza la copia del detalle e invalida el listado', async () => {
    vi.mocked(remote.updateRoutine).mockResolvedValue({ ...routine, title: 'Leer cuento' });
    await updateRoutine(routine.id, { title: 'Leer cuento', category: 'HOGAR', points: 10 });
    expect((await getCachedRoutine(routine.id))?.title).toBe('Leer cuento');
    expect(await getCachedRoutineList(1)).toBeNull();
  });
  it('invalida las tareas del detalle al añadir un paso', async () => {
    vi.mocked(remote.addRoutineTask).mockResolvedValue(undefined);
    await addRoutineTask(routine.id, 'Guardar libro');
    expect(await getCachedRoutine(routine.id)).toBeNull();
  });
  it('conserva todos los pasos de una creación offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const tasks = ['Abrir libro', 'Leer un cuento'];
    await createRoutine({ title: 'Lectura', category: 'HOGAR', points: 10, tasks });
    expect((await listOutboxEntries())[0].request.tasks).toEqual(tasks);
    expect(remote.createRoutine).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
