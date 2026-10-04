import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../../../store/sessionStore';
import { useSyncStatusStore } from '../../../store/sync-status-store';
import { syncOutbox } from '../../../services/repositories/routinesRepository';
import { watchSyncLifecycle } from '../../../services/device/sync-lifecycle';
import { resolveSession } from '../../../services/auth/offline-session';
import { useOfflineStatus } from '../../../store/offline-status';

export const useOutboxSync = (): void => {
  const owner = useSessionStore(state => state.user?.id);
  const queryClient = useQueryClient();
  useEffect(() => {
    useSyncStatusStore.getState().setMessage(null);
    if (!owner) return;
    let disposed = false;
    const sync = (): void => {
      void (async () => {
        if (!navigator.onLine) return { synced: 0, failed: 0, remindersPending: 0 };
        await resolveSession();
        if (disposed || useSessionStore.getState().user?.id !== owner || useOfflineStatus.getState().offline) return { synced: 0, failed: 0, remindersPending: 0 };
        await queryClient.invalidateQueries({ predicate: query => query.queryKey[0] !== 'auth' });
        return syncOutbox();
      })().then(result => {
        if (disposed || useSessionStore.getState().user?.id !== owner) return;
        if (result.synced) {
          void queryClient.invalidateQueries({ queryKey: ['routines'] });
          void queryClient.invalidateQueries({ queryKey: ['student-tracking'] });
        }
        useSyncStatusStore.getState().setMessage(result.failed ? 'Hay rutinas pendientes de sincronizar. Se conservan en este dispositivo.' :
          result.remindersPending ? 'Hay recordatorios sin activar. Revisa los permisos y sus fechas en Mis rutinas.' : null);
      }).catch(() => {
        if (!disposed) useSyncStatusStore.getState().setMessage('No se pudo acceder a los datos pendientes. Puedes seguir usando la app e intentarlo desde Mis rutinas.');
      });
    };
    const stop = watchSyncLifecycle(sync);
    return () => { disposed = true; stop(); };
  }, [owner, queryClient]);
};
