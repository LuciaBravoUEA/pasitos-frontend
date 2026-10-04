import { IonToast } from '@ionic/react';
import { useOutboxSync } from '../features/routines/hooks/use-outbox-sync';
import { useSyncStatusStore } from '../store/sync-status-store';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../store/sessionStore';

export const LocalSync: React.FC = () => {
  useOutboxSync();
  const client = useQueryClient();
  const status = useSessionStore(state => state.status);
  const revision = useSessionStore(state => state.sessionRevision);
  useEffect(() => {
    if (status !== 'unauthenticated') return;
    client.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' || query.queryKey[2] !== revision });
  }, [client, status, revision]);
  const message = useSyncStatusStore(state => state.message);
  return <IonToast isOpen={Boolean(message)} message={message ?? ''} position="top" buttons={['Entendido']} onDidDismiss={() => useSyncStatusStore.getState().setMessage(null)} />;
};
