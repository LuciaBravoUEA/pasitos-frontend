import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authorizeCompanion, findCompanion, getCompanions, revokeCompanion } from '../../../services/api/endpoints/companions';
import { NetworkError } from '../../../services/api/errorMapper';
import { useOfflineStatus } from '../../../store/offline-status';

const connected = <T>(operation: () => Promise<T>): Promise<T> => {
  if (!navigator.onLine || useOfflineStatus.getState().offline) return Promise.reject(new NetworkError('Conéctate para gestionar acompañantes.'));
  return operation();
};

export const useCompanions = (userId: string) => {
  const client = useQueryClient();
  const key = ['companions', userId];
  const account = useQuery({ queryKey: key, queryFn: ({ signal }) => connected(() => getCompanions(signal)), networkMode: 'always', enabled: Boolean(userId), retry: false });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: key });
    await client.invalidateQueries({ queryKey: ['student-tracking'] });
  };
  const search = useMutation({ mutationFn: (username: string) => connected(() => findCompanion(username)), networkMode: 'always' });
  const authorize = useMutation({ mutationFn: (adultId: string) => connected(() => authorizeCompanion(adultId)), networkMode: 'always', onSuccess: refresh });
  const revoke = useMutation({ mutationFn: (adultId: string) => connected(() => revokeCompanion(adultId)), networkMode: 'always', onSuccess: refresh });
  return { account, search, authorize, revoke };
};
