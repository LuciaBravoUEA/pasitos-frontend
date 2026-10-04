import { apiClient } from '../apiClient';
import { companionSchema, companionsAccountSchema } from '../../../types/api/companions';
import type { ApiSuccessEnvelope } from '../../../types/api/common';

export const getCompanions = async (signal?: AbortSignal) => {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>('/acompanantes', { signal });
  return companionsAccountSchema.parse(data.data);
};
export const findCompanion = async (username: string) => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<unknown>>('/acompanantes/buscar', { username });
  return companionSchema.parse(data.data);
};
export const authorizeCompanion = async (adultId: string) => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<unknown>>('/acompanantes', { adultId });
  return companionSchema.parse(data.data);
};
export const revokeCompanion = async (adultId: string): Promise<void> => {
  await apiClient.delete('/acompanantes/' + adultId);
};
