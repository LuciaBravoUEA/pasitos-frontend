import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '../../../store/sessionStore';
import { useSession } from './useSession';
import { getSession } from '../../../services/api/endpoints/auth';
import { useOfflineStatus } from '../../../store/offline-status';
import { AuthenticationError } from '../../../services/api/errorMapper';

vi.mock('../../../services/api/endpoints/auth', () => ({
  getSession: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'estudiante.ejemplo@pasitosmagicos.local',
    name: 'Estudiante de ejemplo',
    roles: [{ id: 'role-1', code: 'estudiante', name: 'Estudiante' }],
    permissions: [],
  }),
  logout: vi.fn(),
}));

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

afterEach(() => {
  useSessionStore.getState().clearSession();
});

describe('useSession', () => {
  it('syncs a successful session fetch into sessionStore', async () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user?.email).toBe('estudiante.ejemplo@pasitosmagicos.local');
  });

  it('guardar la expiración no dispara otra validación remota de sesión', async () => {
    vi.mocked(getSession).mockClear();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    vi.mocked(getSession).mockResolvedValue({ id: 'student', name: 'Prueba', email: 'test@example.test', roles: [], permissions: [], exp });
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useOfflineStatus.getState().validatedUntil).toBe(exp * 1000);
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('perder la sesión no permite restaurar la identidad antigua desde la query cacheada', async () => {
    vi.mocked(getSession).mockResolvedValue({ id: 'old-account', name: 'Anterior', email: 'test@example.test', roles: [], permissions: [] });
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(useSessionStore.getState().user?.id).toBe('old-account'));
    vi.mocked(getSession).mockRejectedValue(new AuthenticationError('revocada'));
    act(() => useSessionStore.getState().clearSession());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(useSessionStore.getState().user).toBeNull();
  });
});
