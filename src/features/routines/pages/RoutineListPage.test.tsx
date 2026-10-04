import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RoutineListPage from './RoutineListPage';
import { listRoutines } from '../../../services/repositories/routinesRepository';
import { NetworkError } from '../../../services/api/errorMapper';
import type { Routine } from '../../../types/api/routines';

// Doble de datos falso del repositorio (continúa la separación remoto/local/repositorio de la
// Semana 13 — spec 010) para entregarle a la pantalla un origen de datos controlado en pruebas,
// sin tocar red ni almacenamiento real.
vi.mock('../../../services/repositories/routinesRepository', () => ({
  listRoutines: vi.fn(),
  getRoutineListSyncStatus: vi.fn().mockResolvedValue({ lastSyncedAt: null, isStale: true }),
}));

const routine: Routine = {
  id: 'routine-1',
  userId: 'user-1',
  title: 'Leer 10 minutos',
  description: null,
  category: 'ESCUELA',
  points: 10,
  completed: false,
  createdAt: '2026-09-20T10:00:00.000Z',
};

const renderPage = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/rutinas']}><RoutineListPage /></MemoryRouter></QueryClientProvider>);
};

describe('RoutineListPage — los cuatro estados de la pantalla principal de rutinas', () => {
  it('cargando: anuncia el estado antes de que responda el repositorio', async () => {
    vi.mocked(listRoutines).mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(await screen.findByRole('status', { name: 'Cargando información' })).toBeInTheDocument();
  });

  it('con datos: renderiza cada rutina devuelta por el repositorio', async () => {
    vi.mocked(listRoutines).mockResolvedValue({ data: [routine], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } });

    renderPage();

    await waitFor(() => expect(screen.getByText('Leer 10 minutos')).toBeInTheDocument());
    expect(screen.getByText(/ESCUELA · 10 estrellas/)).toBeInTheDocument();
  });

  it('vacía: invita a crear la primera rutina cuando el repositorio no devuelve datos', async () => {
    vi.mocked(listRoutines).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });

    renderPage();

    await waitFor(() => expect(screen.getByText('Todavía no tienes rutinas')).toBeInTheDocument());
    expect(screen.getByText('Crear la primera rutina')).toBeInTheDocument();
  });

  it('con error: muestra el mensaje traducido y permite reintentar', async () => {
    vi.mocked(listRoutines).mockRejectedValue(new NetworkError('socket hang up'));

    renderPage();

    await waitFor(() => expect(screen.getByText('No pudimos conectarnos. Revisa tu conexión.')).toBeInTheDocument());
    expect(document.querySelector('ion-button')).not.toBeNull();
  });
});
