import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completeTask, getStudentProgress, getTaskActivityHistory, listAssignedStudents } from '../../../services/api/endpoints/studentTracking';
import { readOffline } from '../../../services/repositories/offline-reader';
import { studentProgressSchema, taskActivityHistorySchema } from '../../../types/api/student-tracking';
import { useSessionStore } from '../../../store/sessionStore';
import { NetworkError } from '../../../services/api/errorMapper';
import { useOfflineStatus } from '../../../store/offline-status';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

export const trackingKeys = {
  assigned: (date: string) => ['student-tracking', 'assigned', date] as const,
  progress: (studentId: string, date: string) => ['student-tracking', 'progress', studentId, date] as const,
  history: (studentId: string, page: number, dateFrom?: string, dateTo?: string) => ['student-tracking', 'history', studentId, page, dateFrom, dateTo] as const,
};

export const useAssignedStudents = (date: string, enabled: boolean) => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const query = useQuery({
  queryKey: trackingKeys.assigned(date),
  queryFn: ({ signal }) => {
    if (!navigator.onLine || useOfflineStatus.getState().offline) throw new NetworkError('Conéctate para consultar tus estudiantes.');
    return listAssignedStudents(date, signal);
  },
  networkMode: 'always',
  enabled,
  retry: false,
  });
  if (!online || offline) return { ...query, data: undefined, isPending: false, isError: true };
  return query;
};

export const useStudentProgress = (studentId: string, date: string, enabled = true) => {
  const owner = useSessionStore(state => state.user?.id);
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const query = useQuery({
  queryKey: [...trackingKeys.progress(studentId, date), owner],
  queryFn: ({ signal }) => readOffline(`progress:${studentId}:${date}`, studentProgressSchema, () => getStudentProgress(studentId, date, signal), owner === studentId),
  networkMode: 'always',
  enabled: enabled && Boolean(studentId),
  retry: false,
  });
  if ((!online || offline) && owner !== studentId) return { ...query, data: undefined, savedAt: undefined, cached: false, isPending: false, isError: true };
  return { ...query, data: query.data?.value, savedAt: query.data?.savedAt, cached: query.data?.offline };
};

export const useTaskActivityHistory = (studentId: string, page: number, enabled = true) => {
  const owner = useSessionStore(state => state.user?.id);
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const query = useQuery({
  queryKey: [...trackingKeys.history(studentId, page), owner],
  queryFn: ({ signal }) => readOffline(`history:${studentId}:${page}:20`, taskActivityHistorySchema, () => getTaskActivityHistory(studentId, page, 20, undefined, undefined, signal), owner === studentId),
  networkMode: 'always',
  enabled: enabled && Boolean(studentId),
  retry: false,
  });
  if ((!online || offline) && owner !== studentId) return { ...query, data: undefined, savedAt: undefined, cached: false, isPending: false, isError: true };
  return { ...query, data: query.data?.value, savedAt: query.data?.savedAt, cached: query.data?.offline };
};

export const useCompleteTask = (studentId: string, date: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      if (!navigator.onLine || useOfflineStatus.getState().offline) throw new NetworkError('Conéctate para guardar el cumplimiento.');
      return completeTask(taskId, completed, date);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trackingKeys.progress(studentId, date) });
      await queryClient.invalidateQueries({ queryKey: trackingKeys.assigned(date) });
      await queryClient.invalidateQueries({ queryKey: ['student-tracking', 'history', studentId] });
    },
  });
};
