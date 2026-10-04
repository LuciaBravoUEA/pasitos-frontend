import { create } from 'zustand';
import type { SessionUser } from '../types/api/auth';
import { clearMonitoringUser, setMonitoringUser } from '../services/telemetry/monitoring';

type SessionStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface SessionState {
  user: SessionUser | null;
  status: SessionStatus;
  navigationSession: number;
  sessionRevision: number;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

// Espejo imperativo de la sesión (server-state real vive en TanStack Query, ver
// features/auth/hooks/useSession.ts) para que código no-React, como el interceptor 401 de
// apiClient, pueda leer/limpiar la sesión sin depender de hooks — ver tech-stack.md §5.
export const useSessionStore = create<SessionState>(set => ({
  user: null,
  status: 'idle',
  navigationSession: 0,
  sessionRevision: 0,
  // Identificador interno (`user.id`) para el monitoreo de fallos — nunca correo/documento,
  // ver AGENTS.md §6.
  setSession: user => {
    setMonitoringUser(user.id);
    // Ionic conserva vistas ocultas; una sesión nueva debe tener su propia pila de páginas.
    set(state => ({ user, status: 'authenticated', navigationSession: state.navigationSession + (state.user?.id === user.id ? 0 : 1) }));
  },
  clearSession: () => {
    clearMonitoringUser();
    set(state => ({ user: null, status: 'unauthenticated', sessionRevision: state.sessionRevision + (state.user ? 1 : 0) }));
  },
}));
