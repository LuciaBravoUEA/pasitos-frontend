import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../../../pages/Home';
import StudentTrackingPage from './StudentTrackingPage';
import { useSessionStore } from '../../../store/sessionStore';
import { useRewardPreferences } from '../../../store/reward-preferences';
import { completeTask, getStudentProgress } from '../../../services/api/endpoints/studentTracking';
import { playRewardSound } from '../../../services/device/reward-sound';
import type { StudentProgress, TaskProgress } from '../../../types/api/student-tracking';

vi.mock('../../../services/api/endpoints/studentTracking', () => ({ completeTask: vi.fn(), getStudentProgress: vi.fn(), listAssignedStudents: vi.fn() }));
vi.mock('../../../features/auth/hooks/useSession', () => ({ useLogoutMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock('../../../services/device/reward-sound', () => ({ prepareRewardSound: vi.fn(), playRewardSound: vi.fn() }));
vi.mock('../../../services/storage/preferences', () => ({ getPreference: vi.fn().mockResolvedValue(null), setPreference: vi.fn().mockResolvedValue(undefined) }));

const task: TaskProgress = { id: 'task-1', routineId: 'routine-1', routineTitle: 'Lectura diaria', title: 'Leer una página', description: null, position: 0, completed: false, completedAt: null };
const progress: StudentProgress = {
  student: { id: 'student-1', name: 'Eva', email: 'eva@example.test' }, date: '2026-10-01',
  routines: [{ id: 'routine-1', title: 'Lectura diaria', description: null, category: 'ESCUELA', tasks: [task] }],
  totals: { tasks: 1, completed: 0, pending: 1, progressPercent: 0, stars: 0 },
};
beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession({ id: 'student-1', name: 'Eva', email: 'eva@example.test', roles: [{ id: 'student', code: 'estudiante', name: 'Estudiante' }], permissions: [] });
  useRewardPreferences.setState({ loaded: true, soundEnabled: true, error: null });
  vi.mocked(getStudentProgress).mockResolvedValue(progress);
  vi.mocked(completeTask).mockResolvedValue({ ...task, completed: true });
});
afterEach(() => { cleanup(); useSessionStore.getState().clearSession(); });

describe.each([['Inicio', Home], ['Seguimiento', StudentTrackingPage]] as const)('Recompensas en %s', (_name, Page) => {
  const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><Page /></MemoryRouter></QueryClientProvider>);

  it('espera la confirmación remota antes de celebrar con imagen y sonido', async () => {
    let confirm: (value: TaskProgress) => void = () => undefined;
    vi.mocked(completeTask).mockReturnValue(new Promise(resolve => { confirm = resolve; }));
    show();
    fireEvent.click(await screen.findByText('Completar'));
    expect(screen.queryByText('¡Un paso más, lo lograste!')).toBeNull();
    expect(playRewardSound).not.toHaveBeenCalled();
    confirm({ ...task, completed: true });
    expect(await screen.findByText('¡Un paso más, lo lograste!')).toBeInTheDocument();
    expect(playRewardSound).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Cerrar celebración'));
    expect(screen.queryByText('¡Un paso más, lo lograste!')).toBeNull();
  });

  it('no celebra un error de guardado', async () => {
    vi.mocked(completeTask).mockRejectedValue(new Error('offline'));
    show();
    fireEvent.click(await screen.findByText('Completar'));
    await screen.findByText(/No se pudo guardar/);
    expect(playRewardSound).not.toHaveBeenCalled();
    expect(screen.queryByText('¡Un paso más, lo lograste!')).toBeNull();
  });

  it('conserva la recompensa visual al silenciar', async () => {
    show();
    fireEvent.click(await screen.findByText('Silenciar celebraciones'));
    fireEvent.click(await screen.findByText('Completar'));
    expect(await screen.findByText('¡Un paso más, lo lograste!')).toBeInTheDocument();
    expect(playRewardSound).not.toHaveBeenCalled();
    expect(screen.getByText('Activar sonido de celebraciones')).toBeInTheDocument();
  });

  it('no recompensa cargar ni desmarcar una actividad ya completada', async () => {
    vi.mocked(getStudentProgress).mockResolvedValue({ ...progress, routines: [{ ...progress.routines[0], tasks: [{ ...task, completed: true }] }] });
    vi.mocked(completeTask).mockResolvedValue(task);
    show();
    fireEvent.click(await screen.findByText('Desmarcar'));
    await waitFor(() => expect(completeTask).toHaveBeenCalledWith(task.id, false, expect.any(String)));
    await waitFor(() => expect(getStudentProgress).toHaveBeenCalledTimes(2));
    expect(playRewardSound).not.toHaveBeenCalled();
    expect(screen.queryByText('¡Un paso más, lo lograste!')).toBeNull();
  });
});
