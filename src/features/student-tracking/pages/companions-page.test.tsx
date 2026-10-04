import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CompanionsPage from './companions-page';
import { useSessionStore } from '../../../store/sessionStore';
import { authorizeCompanion, findCompanion, getCompanions, revokeCompanion } from '../../../services/api/endpoints/companions';
import type { Companion } from '../../../types/api/companions';

vi.mock('../../../services/api/endpoints/companions', () => ({ getCompanions: vi.fn(), findCompanion: vi.fn(), authorizeCompanion: vi.fn(), revokeCompanion: vi.fn() }));
const adult: Companion = { id: '22222222-2222-4222-8222-222222222222', name: 'Nora', username: 'nora', role: 'docente' };
const user = { id: 'student', name: 'Eva', email: 'eva@example.test', roles: [{ id: 'role', code: 'estudiante', name: 'Estudiante' }], permissions: [] };
const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><CompanionsPage /></MemoryRouter></QueryClientProvider>);
beforeEach(() => {
  vi.clearAllMocks();
  useSessionStore.getState().setSession(user);
  vi.mocked(getCompanions).mockResolvedValue({ username: 'eva', companions: [] });
  vi.mocked(findCompanion).mockResolvedValue(adult);
  vi.mocked(authorizeCompanion).mockResolvedValue(adult);
  vi.mocked(revokeCompanion).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); useSessionStore.getState().clearSession(); });

describe('Vinculación educativa', () => {
  it('valida usuario vacío sin consultar el servidor', async () => {
    const { container } = show();
    await screen.findByText('Buscar acompañante');
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(container.querySelector('ion-input')).toHaveAttribute('error-text', 'Escribe el usuario del adulto'));
    expect(findCompanion).not.toHaveBeenCalled();
  });

  it('buscar solo muestra identidad; necesita confirmar antes de autorizar', async () => {
    const { container } = show();
    await screen.findByText('Buscar acompañante');
    fireEvent(container.querySelector('ion-input')!, new CustomEvent('ionInput', { detail: { value: 'nora' }, bubbles: true }));
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText('Comprueba a quién autorizas');
    expect(findCompanion).toHaveBeenCalledWith('nora');
    expect(authorizeCompanion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Autorizar acompañante')).toBeNull();
    fireEvent.submit(container.querySelector('form')!);
    fireEvent.click(await screen.findByText('Autorizar acompañante'));
    await screen.findByText('Nora ya puede consultar tus actividades y tu progreso.');
    expect(authorizeCompanion).toHaveBeenCalledWith(adult.id);
  });

  it('cancelar la retirada conserva el vínculo y confirmar actualiza la lista', async () => {
    vi.mocked(getCompanions).mockResolvedValue({ username: 'eva', companions: [adult] });
    vi.mocked(revokeCompanion).mockImplementation(async () => { vi.mocked(getCompanions).mockResolvedValue({ username: 'eva', companions: [] }); });
    show();
    fireEvent.click(await screen.findByText('Retirar acceso a Nora'));
    fireEvent.click(screen.getByText('Conservar acceso'));
    expect(revokeCompanion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Retirar acceso a Nora'));
    fireEvent.click(screen.getByText('Confirmar retirada'));
    await screen.findByText('El acceso fue retirado. Tus actividades y tu progreso se conservan.');
    expect(screen.queryByText('Retirar acceso a Nora')).toBeNull();
  });

  it('conserva el vínculo visible si falla la retirada', async () => {
    vi.mocked(getCompanions).mockResolvedValue({ username: 'eva', companions: [adult] });
    vi.mocked(revokeCompanion).mockRejectedValue(new Error('offline'));
    show();
    fireEvent.click(await screen.findByText('Retirar acceso a Nora'));
    fireEvent.click(screen.getByText('Confirmar retirada'));
    await screen.findByRole('alert');
    expect(screen.getByText('Nora')).toBeInTheDocument();
    expect(screen.queryByText('El acceso fue retirado. Tus actividades y tu progreso se conservan.')).toBeNull();
  });

  it.each(['padre_familia', 'docente'])('muestra instrucciones y usuario al perfil %s, sin autoasignación', async role => {
    useSessionStore.getState().setSession({ ...user, roles: [{ id: 'role', code: role, name: role }] });
    vi.mocked(getCompanions).mockResolvedValue({ username: 'adulto_prueba', companions: [] });
    show();
    await screen.findByText('Tu usuario es: adulto_prueba');
    expect(screen.queryByText('Buscar acompañante')).toBeNull();
    expect(screen.getByText('No necesitas su contraseña. Solo verás a los estudiantes que te autoricen.')).toBeInTheDocument();
  });
});
