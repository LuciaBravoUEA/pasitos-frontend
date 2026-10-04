import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '../store/sessionStore';
import { completeTask, getStudentProgress, listAssignedStudents } from '../services/api/endpoints/studentTracking';
import type { StudentProgress } from '../types/api/student-tracking';
import Home from './Home';

vi.mock('../services/api/endpoints/studentTracking', () => ({ completeTask: vi.fn(), getStudentProgress: vi.fn(), listAssignedStudents: vi.fn() }));
vi.mock('../features/auth/hooks/useSession', () => ({ useLogoutMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
const user = { id: 'student-1', name: 'Eva Prueba', email: 'eva@example.test', roles: [{ id: 'role-1', code: 'estudiante', name: 'Estudiante' }], permissions: [] };
const progress: StudentProgress = {
  student: { id: user.id, name: user.name, email: user.email }, date: '2026-10-01',
  routines: [{ id: 'routine-1', title: 'Rutina real', description: null, category: 'HOGAR', tasks: [{ id: 'task-1', routineId: 'routine-1', routineTitle: 'Rutina real', title: 'Preparar mochila', description: null, position: 0, completed: false, completedAt: null }] }],
  totals: { tasks: 1, completed: 0, pending: 1, progressPercent: 0, stars: 0 },
};
const renderHome = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><Home /></MemoryRouter></QueryClientProvider>);
};
beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession(user);
  vi.mocked(getStudentProgress).mockResolvedValue(progress);
  vi.mocked(listAssignedStudents).mockResolvedValue([]);
});
afterEach(() => { cleanup(); useSessionStore.getState().clearSession(); });

describe('Inicio con progreso persistente', () => {
  it('muestra datos remotos sin actividades ni rachas ficticias', async () => {
    renderHome();
    expect(await screen.findByText('0 de 1 tareas completadas')).toBeInTheDocument();
    expect(screen.getByText('Preparar mochila')).toBeInTheDocument();
    expect(screen.queryByText('Ordenar útiles')).toBeNull();
    expect(screen.queryByText('Racha de la semana')).toBeNull();
  });
  it('guarda el cumplimiento y vuelve a consultar el progreso', async () => {
    vi.mocked(completeTask).mockImplementation(async () => {
      vi.mocked(getStudentProgress).mockResolvedValue({ ...progress, totals: { tasks: 1, completed: 1, pending: 0, progressPercent: 100, stars: 10 } });
      return { ...progress.routines[0].tasks[0], completed: true };
    });
    renderHome();
    await screen.findByText('Preparar mochila');
    fireEvent.click(await screen.findByText('Completar'));
    expect(await screen.findByText('1 de 1 tareas completadas')).toBeInTheDocument();
    expect(completeTask).toHaveBeenCalledWith('task-1', true, expect.any(String));
    expect(await screen.findByText('¡Buen trabajo! Tu avance quedó guardado.')).toBeInTheDocument();
  });
  it('conserva el progreso si falla el servidor', async () => {
    vi.mocked(completeTask).mockRejectedValue(new Error('offline'));
    renderHome();
    await screen.findByText('Preparar mochila');
    fireEvent.click(await screen.findByText('Completar'));
    expect(await screen.findByText('No se pudo guardar el avance. Comprueba tu conexión y vuelve a intentar.')).toBeInTheDocument();
    expect(screen.getByText('0 de 1 tareas completadas')).toBeInTheDocument();
  });
  it('muestra a los adultos la lista asignada recibida del servidor', async () => {
    useSessionStore.getState().setSession({ ...user, roles: [{ id: 'parent', code: 'padre_familia', name: 'Padre' }] });
    vi.mocked(listAssignedStudents).mockResolvedValue([{ id: 'student-2', name: 'Estudiante asignado', email: 'test@example.test', roleCode: 'estudiante', routinesToday: 1, tasksToday: 3, completedToday: 2, progressPercent: 67 }]);
    renderHome();
    expect(await screen.findByText('Estudiante asignado')).toBeInTheDocument();
    expect(getStudentProgress).not.toHaveBeenCalled();
  });
});
