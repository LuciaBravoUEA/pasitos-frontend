import type { ApiListEnvelope, ApiSuccessEnvelope } from '../../../types/api/common';
import type { CreateRoutineRequest, Routine } from '../../../types/api/routines';
import { apiClient } from '../apiClient';
import { routineDetailSchema, routineTaskSchema, type RoutineDetail } from '../../../types/api/routines';

// Fuente REMOTA del dominio rutinas — solo Axios, sin cache ni cola de salida (eso vive en
// services/local/ y se orquesta desde services/repositories/routinesRepository.ts). Acepta
// AbortSignal para que TanStack Query cancele la petición al desmontar la pantalla.
export const listRoutines = async (
  page: number,
  pageSize = 10,
  signal?: AbortSignal,
): Promise<ApiListEnvelope<Routine>> => {
  const { data } = await apiClient.get<ApiListEnvelope<Routine>>('/rutinas', { params: { page, pageSize }, signal });
  return data;
};

export const getRoutine = async (routineId: string, signal?: AbortSignal): Promise<RoutineDetail> => {
  const { data } = await apiClient.get<ApiSuccessEnvelope<Routine>>(`/rutinas/${routineId}`, { signal });
  return routineDetailSchema.parse(data.data);
};

export const updateRoutine = async (routineId: string, request: CreateRoutineRequest): Promise<RoutineDetail> => {
  const { data } = await apiClient.put<ApiSuccessEnvelope<unknown>>(`/rutinas/${routineId}`, request);
  return routineDetailSchema.parse(data.data);
};

export const deleteRoutine = async (routineId: string): Promise<void> => {
  await apiClient.delete(`/rutinas/${routineId}`);
};

export const addRoutineTask = async (routineId: string, title: string): Promise<void> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<unknown>>(`/rutinas/${routineId}/tareas`, { title });
  routineTaskSchema.parse(data.data);
};

export const createRoutine = async (request: CreateRoutineRequest, signal?: AbortSignal): Promise<Routine> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<Routine>>('/rutinas', request, { signal });
  return data.data;
};
