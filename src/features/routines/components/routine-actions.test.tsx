import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { RoutineActions } from './routine-actions';
import { addRoutineTask, deleteRoutine, updateRoutine } from '../../../services/repositories/routinesRepository';
import { useSessionStore } from '../../../store/sessionStore';
import type { RoutineDetail } from '../../../types/api/routines';

vi.mock('../../../services/repositories/routinesRepository', () => ({ addRoutineTask: vi.fn(), deleteRoutine: vi.fn(), updateRoutine: vi.fn() }));
const routine: RoutineDetail = { id: 'routine-1', userId: 'user-1', title: 'Leer', description: null, category: 'HOGAR', points: 10, completed: false, createdAt: '2026-10-01', tasks: [{ id: 'task-1', title: 'Abrir libro', description: null, position: 0 }] };
const renderActions = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><RoutineActions routine={routine} /></MemoryRouter></QueryClientProvider>);
beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession({ id: 'user-1', name: 'Prueba', email: 'test@example.test', roles: [], permissions: [{ id: 'permission', code: 'rutinas.manage' }] });
  vi.mocked(deleteRoutine).mockResolvedValue(undefined);
  vi.mocked(updateRoutine).mockResolvedValue(routine);
  vi.mocked(addRoutineTask).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); useSessionStore.getState().clearSession(); });
describe('Gestión de rutinas persistentes', () => {
  it('cancelar la confirmación conserva la rutina y confirmar realiza una sola eliminación', async () => {
    renderActions();
    fireEvent.click(screen.getByText('Eliminar rutina'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(deleteRoutine).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Conservar rutina'));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    fireEvent.click(screen.getByText('Eliminar rutina'));
    fireEvent.click(screen.getByText('Confirmar eliminación'));
    await waitFor(() => expect(deleteRoutine).toHaveBeenCalledTimes(1));
    expect(deleteRoutine).toHaveBeenCalledWith('routine-1');
  });
  it('impide guardar un título inválido y conserva las tareas al editar', async () => {
    const { container } = renderActions();
    fireEvent.click(screen.getByText('Editar rutina'));
    const title = container.querySelector('ion-input[label="Título"]')!;
    fireEvent(title, new CustomEvent('ionInput', { detail: { value: 'x' }, bubbles: true }));
    fireEvent.submit(screen.getByRole('form', { name: 'Editar rutina' }));
    await waitFor(() => expect(title).toHaveAttribute('error-text'));
    expect(updateRoutine).not.toHaveBeenCalled();
    fireEvent(title, new CustomEvent('ionInput', { detail: { value: 'Leer un cuento' }, bubbles: true }));
    fireEvent.submit(screen.getByRole('form', { name: 'Editar rutina' }));
    await screen.findByText('Los cambios quedaron guardados.');
    expect(updateRoutine).toHaveBeenCalledWith('routine-1', { title: 'Leer un cuento', description: '', category: 'HOGAR', points: 10 });
    expect(screen.getByText('Abrir libro')).toBeInTheDocument();
  });
  it('valida y guarda una nueva tarea', async () => {
    const { container } = renderActions();
    fireEvent.submit(screen.getByRole('form', { name: 'Añadir tarea' }));
    await waitFor(() => expect(container.querySelector('ion-input[label="Nueva tarea"]')).toHaveAttribute('error-text'));
    expect(addRoutineTask).not.toHaveBeenCalled();
    fireEvent(container.querySelector('ion-input[label="Nueva tarea"]')!, new CustomEvent('ionInput', { detail: { value: 'Guardar libro' }, bubbles: true }));
    fireEvent.submit(screen.getByRole('form', { name: 'Añadir tarea' }));
    await screen.findByText('La tarea quedó guardada.');
    expect(addRoutineTask).toHaveBeenCalledWith('routine-1', 'Guardar libro');
  });
});
