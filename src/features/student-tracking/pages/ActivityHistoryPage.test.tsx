import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ActivityHistoryPage from './ActivityHistoryPage';
import { useSessionStore } from '../../../store/sessionStore';
import { getTaskActivityHistory } from '../../../services/api/endpoints/studentTracking';
import type { TaskActivityHistory } from '../../../types/api/student-tracking';

vi.mock('../../../services/api/endpoints/studentTracking', () => ({
  completeTask: vi.fn(),
  getStudentProgress: vi.fn(),
  getTaskActivityHistory: vi.fn(),
  listAssignedStudents: vi.fn(),
}));

const page = (currentPage: number, totalPages: number): TaskActivityHistory => ({
  data: [{
    id: `event-${currentPage}`,
    studentId: 'student-1',
    taskId: 'task-1',
    routineId: 'routine-1',
    taskTitle: 'Leer una página',
    routineTitle: 'Rutina archivada',
    completed: currentPage === 1,
    activityDate: '2026-10-03',
    recordedAt: '2026-10-03T12:00:00.000Z',
  }],
  meta: { page: currentPage, pageSize: 20, total: totalPages * 20, totalPages },
});

beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession({
    id: 'student-1',
    name: 'Eva',
    email: 'eva@example.test',
    roles: [{ id: 'student', code: 'estudiante', name: 'Estudiante' }],
    permissions: [],
  });
  vi.mocked(getTaskActivityHistory).mockImplementation(async (_studentId, currentPage = 1) => page(currentPage, 2));
});

afterEach(() => {
  cleanup();
  useSessionStore.getState().clearSession();
});

describe('ActivityHistoryPage', () => {
  it('muestra el historial conservado y carga la página solicitada', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/historial']}><Route exact path="/historial"><ActivityHistoryPage /></Route></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByText('Leer una página')).toBeInTheDocument();
    expect(screen.getByText(/Rutina: Rutina archivada/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Siguiente'));

    await waitFor(() => expect(getTaskActivityHistory).toHaveBeenLastCalledWith('student-1', 2, 20, undefined, undefined, expect.anything()));
    expect(await screen.findByText('Desmarcada · Fecha de actividad: 2026-10-03')).toBeInTheDocument();
  });
});
