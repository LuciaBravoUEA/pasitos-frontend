import { describe, expect, it } from 'vitest';
import { useSessionStore } from './sessionStore';

const sampleUser = {
  id: 'user-1',
  email: 'estudiante.ejemplo@pasitosmagicos.local',
  name: 'Estudiante de ejemplo',
  roles: [{ id: 'role-1', code: 'estudiante', name: 'Estudiante' }],
  permissions: [],
};

describe('sessionStore', () => {
  it('starts idle with no user', () => {
    expect(useSessionStore.getState().status).toBe('idle');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('setSession marks the store as authenticated', () => {
    useSessionStore.getState().setSession(sampleUser);

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user).toEqual(sampleUser);
  });

  it('clearSession resets the store', () => {
    useSessionStore.getState().setSession(sampleUser);
    useSessionStore.getState().clearSession();

    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('invalida la identidad cacheada una sola vez al perder una sesión autenticada', () => {
    useSessionStore.getState().setSession(sampleUser);
    const revision = useSessionStore.getState().sessionRevision;
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().sessionRevision).toBe(revision + 1);
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().sessionRevision).toBe(revision + 1);
  });

  it('renueva la navegación al entrar con otra cuenta, pero no al refrescar la misma sesión', () => {
    useSessionStore.getState().setSession(sampleUser);
    const first = useSessionStore.getState().navigationSession;
    useSessionStore.getState().setSession({ ...sampleUser, name: 'Nombre actualizado' });
    expect(useSessionStore.getState().navigationSession).toBe(first);
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().navigationSession).toBe(first);
    useSessionStore.getState().setSession({ ...sampleUser, id: 'teacher-2' });
    expect(useSessionStore.getState().navigationSession).toBe(first + 1);
    useSessionStore.getState().clearSession();
    useSessionStore.getState().setSession({ ...sampleUser, id: 'teacher-2' });
    expect(useSessionStore.getState().navigationSession).toBe(first + 2);
  });
});
