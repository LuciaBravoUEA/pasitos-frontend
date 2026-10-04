import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { logout as logoutRequest } from '../../../services/api/endpoints/auth';
import { clearSessionToken } from '../../../services/storage/secureToken';
import { clearLocalPreferences } from '../../../services/storage/preferences';
import { clearLocalDatabase } from '../../../services/local/local-database';
import { cancelAllRoutineReminders } from '../../../services/device/routineReminders';
import { logger } from '../../../services/telemetry/logger';
import { useSessionStore } from '../../../store/sessionStore';
import { resolveSession } from '../../../services/auth/offline-session';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useOfflineStatus } from '../../../store/offline-status';
import { beginSessionChange } from '../../../services/auth/session-generation';

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export const useSession = () => {
  const online = useNetworkStatus();
  const until = useOfflineStatus(state => state.validatedUntil);
  const revision = useSessionStore(state => state.sessionRevision);
  const setSession = useSessionStore(state => state.setSession);
  const clearSession = useSessionStore(state => state.clearSession);

  const query = useQuery({
    queryKey: [...SESSION_QUERY_KEY, revision],
    queryFn: ({ signal }) => resolveSession(signal),
    networkMode: 'always',
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const { refetch } = query;

  useEffect(() => {
    if (online) void refetch({ cancelRefetch: false });
  }, [online, refetch]);

  useEffect(() => {
    const timer = until > Date.now() ? window.setTimeout(() => { void refetch({ cancelRefetch: false }); }, Math.min(until - Date.now() + 10, 2147483647)) : undefined;
    return () => window.clearTimeout(timer);
  }, [until, refetch]);

  useEffect(() => {
    if (query.isError) {
      clearSession();
    } else if (query.data) {
      setSession(query.data);
    }
  }, [query.data, query.isError, setSession, clearSession]);

  return query;
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore(state => state.clearSession);

  return useMutation({
    onMutate: async () => {
      beginSessionChange();
      await queryClient.cancelQueries();
    },
    mutationFn: async () => { if (navigator.onLine) await logoutRequest(); },
    networkMode: 'always',
    onSettled: async () => {
      beginSessionChange();
      // No-op inofensivo en web (nunca se escribió nada ahí) — limpia el Bearer en nativo.
      await clearSessionToken();
      await queryClient.cancelQueries();
      clearSession();
      useOfflineStatus.getState().setStatus(!navigator.onLine);
      const cleanup = await Promise.allSettled([clearLocalPreferences(), clearLocalDatabase(), cancelAllRoutineReminders()]);
      if (cleanup.some(result => result.status === 'rejected')) logger.warn('No se pudo completar la limpieza local al cerrar sesión');
      // Limpia todo lo demás (datos de negocio cacheados), pero la sesión se maneja aparte:
      // queryClient.clear() no fuerza un refetch de las queries activas, así que un
      // ProtectedRoute ya montado nunca se enteraría del logout. resetQueries sí refetch-ea
      // las queries activas — es lo que realmente dispara la redirección a /login.
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' });
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
};
