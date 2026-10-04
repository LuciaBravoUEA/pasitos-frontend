import { useIonViewWillEnter } from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { addRoutineTask, deleteRoutine, updateRoutine, createRoutine, getRoutine, getRoutineListSyncStatus, listRoutines } from '../../../services/repositories/routinesRepository';
import { getUserErrorMessage } from '../../../services/api/errorMapper';
import type { Routine, RoutineDetail, CreateRoutineRequest } from '../../../types/api/routines';
import type { RemoteData } from '../../../types/remote-data';

export const routineKeys = {
  all: ['routines'] as const,
  list: (page: number) => ['routines', 'list', { page }] as const,
  detail: (routineId: string) => ['routines', 'detail', routineId] as const,
};

export const useRoutines = (page: number) => {
  const [syncStatus, setSyncStatus] = useState({ lastSyncedAt: null as string | null, isStale: true });
  const query = useQuery({
    queryKey: routineKeys.list(page),
    queryFn: ({ signal }) => listRoutines(page, signal),
    networkMode: 'always',
    // Reintento propio del repositorio/apiClient ya cubre red/timeout en GET (ver apiClient.ts);
    // aquí se desactiva el retry de TanStack Query para no duplicar la espera creciente.
    retry: false,
  });
  useIonViewWillEnter(() => { void query.refetch(); });
  useEffect(() => {
    void getRoutineListSyncStatus(page).then(setSyncStatus).catch(() => setSyncStatus({ lastSyncedAt: null, isStale: true }));
  }, [page, query.data]);
  let state: RemoteData<Routine[]>;
  if (query.isPending) state = { status: 'loading' };
  else if (query.isError) state = { status: 'error', message: getUserErrorMessage(query.error), retry: () => void query.refetch() };
  else if (query.data.data.length === 0) state = { status: 'empty' };
  else state = { status: 'success', data: query.data.data };
  return { state, meta: query.data?.meta, syncStatus };
};

export const useRoutine = (routineId: string, enabled: boolean) => {
  const query = useQuery({
    queryKey: routineKeys.detail(routineId),
    queryFn: ({ signal }) => getRoutine(routineId, signal),
    networkMode: 'always',
    enabled,
    retry: false,
  });
  useIonViewWillEnter(() => { if (enabled) void query.refetch(); });
  let state: RemoteData<RoutineDetail>;
  if (query.isPending) state = { status: 'loading' };
  else if (query.isError) state = { status: 'error', message: getUserErrorMessage(query.error), retry: () => void query.refetch() };
  else state = { status: 'success', data: query.data };
  return state;
};

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Mutación (POST) — nunca lleva retry automático (no es idempotente), a diferencia de las
    // queries GET de arriba. Ver apiClient.ts: el backoff del interceptor solo aplica a GET.
    mutationFn: (input: { request: CreateRoutineRequest; reminderAt?: string }) => createRoutine(input.request, input.reminderAt),
    networkMode: 'always',
    onSuccess: async result => {
      if ('queued' in result) return;
      void queryClient.invalidateQueries({ queryKey: routineKeys.detail(result.id) });
      void queryClient.invalidateQueries({ queryKey: ['routines', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['student-tracking'] });
    },
  });
};

export const useRoutineChanges = (routineId: string) => {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: routineKeys.all });
    await client.invalidateQueries({ queryKey: ['student-tracking'] });
  };
  const update = useMutation({ mutationFn: (request: CreateRoutineRequest) => updateRoutine(routineId, request), onSuccess: refresh });
  const addTask = useMutation({ mutationFn: (title: string) => addRoutineTask(routineId, title), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => deleteRoutine(routineId), onSuccess: async () => {
    client.removeQueries({ queryKey: routineKeys.detail(routineId) });
    await refresh();
  } });
  return { update, addTask, remove };
};
