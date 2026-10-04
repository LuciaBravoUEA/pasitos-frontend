import type { z } from 'zod';
import { getLocalValue, setLocalValue, localOwner } from '../local/local-database';
import { NetworkError, TimeoutError } from '../api/errorMapper';
import { logger } from '../telemetry/logger';
import { useOfflineStatus } from '../../store/offline-status';

export interface SavedResponse<T> { value: T; savedAt: string; offline: boolean }
const TTL = 24 * 60 * 60 * 1000;

export const readOffline = async <T>(key: string, schema: z.ZodType<T>, remote: () => Promise<T>, allowOffline = true): Promise<SavedResponse<T>> => {
  const owner = localOwner();
  try {
    if (!navigator.onLine || useOfflineStatus.getState().offline) throw new NetworkError('Necesitas conexión para consultar estos datos.');
    const value = schema.parse(await remote());
    if (localOwner() !== owner) throw new Error('Sesión anterior');
    const savedAt = new Date().toISOString();
    if (allowOffline) await setLocalValue(key, JSON.stringify({ version: 1, savedAt, value }), owner).catch(() => logger.warn('No se pudo guardar la consulta sin conexión'));
    return { value, savedAt, offline: false };
  } catch (error) {
    if (!allowOffline || !(error instanceof NetworkError || error instanceof TimeoutError) || owner !== localOwner()) throw error;
    useOfflineStatus.getState().setStatus(true, useOfflineStatus.getState().validatedUntil);
    const raw = await getLocalValue(key, owner);
    if (!raw) throw new NetworkError('Estos datos no están descargados. Conéctate para consultarlos.');
    try {
      const record: unknown = JSON.parse(raw);
      if (!record || typeof record !== 'object' || !('version' in record) || record.version !== 1 || !('savedAt' in record) || typeof record.savedAt !== 'string' || !('value' in record)) throw error;
      const age = Date.now() - Date.parse(record.savedAt);
      if (!Number.isFinite(age) || age < 0 || age >= TTL || owner !== localOwner()) throw error;
      return { value: schema.parse(record.value), savedAt: record.savedAt, offline: true };
    } catch { throw new NetworkError('No hay una copia vigente de estos datos. Conéctate para actualizarlos.'); }
  }
};
