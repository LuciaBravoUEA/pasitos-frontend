import * as remoteRoutines from '../api/endpoints/routines';
import { logger } from '../telemetry/logger';
import { localOwner } from '../local/local-database';
import { deliverReminderIntents, saveReminderIntent } from '../local/reminder-intents';
import { useSessionStore } from '../../store/sessionStore';
import { enqueueRoutineCreation, listOutboxEntries, removeOutboxEntry, updateOutboxEntry } from '../local/outboxQueue';
import { getCachedRoutine, getCachedRoutinePage, getRoutineListCacheStatus, setCachedRoutine, setCachedRoutineList } from '../local/routinesLocalSource';
import { useOfflineStatus } from '../../store/offline-status';
import { Capacitor } from '@capacitor/core';
import { resolveSession } from '../auth/offline-session';
import type { ApiListEnvelope } from '../../types/api/common';
import type { CreateRoutineRequest, Routine } from '../../types/api/routines';
import type { RoutineDetail } from '../../types/api/routines';
import { invalidateRoutineCache } from '../local/routinesLocalSource';
import { NetworkError, TimeoutError } from '../api/errorMapper';
import { removeReminderIntent } from '../local/reminder-intents';
import { cancelRoutineReminder } from '../device/routineReminders';
import { isNotificationsCapabilityAvailable } from '../device/notificationPermission';
import { removeLocalValue } from '../local/local-database';

// Único punto que los hooks de features/routines pueden importar para leer/escribir rutinas.
// Orquesta remoto (services/api/endpoints/routines.ts) + local (services/local/*) + outbox.
// Los hooks y las pantallas NUNCA importan endpoints/routines.ts ni apiClient directamente —
// ver spec/features/010-cliente-http-datos-chatbot/spec.md, criterio de aceptación correspondiente.

export const listRoutines = async (page: number, signal?: AbortSignal): Promise<ApiListEnvelope<Routine>> => {
  const owner = localOwner();
  try {
    if (!navigator.onLine || useOfflineStatus.getState().offline) throw new NetworkError('Sin conexión');
    const remote = await remoteRoutines.listRoutines(page, 10, signal);
    if (localOwner() !== owner) throw new Error('Sesión anterior');
    await setCachedRoutineList(page, remote.data, remote.meta).catch(() => logger.warn('No se pudo guardar la caché local'));
    return remote;
  } catch (error) {
    if (!(error instanceof NetworkError || error instanceof TimeoutError)) throw error;
    useOfflineStatus.getState().setStatus(true, useOfflineStatus.getState().validatedUntil);
    if (localOwner() !== owner) throw error;
    const cached = await getCachedRoutinePage(page);
    if (cached) return cached;
    throw new NetworkError('Esta página no está descargada. Conéctate para consultarla.');
  }
};

export const getRoutineListSyncStatus = getRoutineListCacheStatus;

export const getRoutine = async (routineId: string, signal?: AbortSignal): Promise<RoutineDetail> => {
  const owner = localOwner();
  try {
    if (!navigator.onLine || useOfflineStatus.getState().offline) throw new NetworkError('Sin conexión');
    const remote = await remoteRoutines.getRoutine(routineId, signal);
    if (localOwner() !== owner) throw new Error('Sesión anterior');
    await setCachedRoutine(remote).catch(() => logger.warn('No se pudo guardar la caché local'));
    return remote;
  } catch (error) {
    if (!(error instanceof NetworkError || error instanceof TimeoutError)) throw error;
    useOfflineStatus.getState().setStatus(true, useOfflineStatus.getState().validatedUntil);
    if (localOwner() !== owner) throw error;
    const cached = await getCachedRoutine(routineId);
    if (cached) return cached;
    throw error;
  }
};

export const updateRoutine = async (routineId: string, request: CreateRoutineRequest): Promise<RoutineDetail> => {
  requireConnection();
  const result = await remoteRoutines.updateRoutine(routineId, request);
  await invalidateRoutineCache(routineId);
  await setCachedRoutine(result);
  return result;
};

export const addRoutineTask = async (routineId: string, title: string): Promise<void> => {
  requireConnection();
  await remoteRoutines.addRoutineTask(routineId, title);
  await invalidateRoutineCache(routineId);
};

export const deleteRoutine = async (routineId: string): Promise<void> => {
  requireConnection();
  await remoteRoutines.deleteRoutine(routineId);
  await invalidateRoutineCache(routineId);
  await removeReminderIntent(routineId);
  await removeLocalValue(`pasitos_magicos_routine_evidence_photo_${routineId}`);
  if (isNotificationsCapabilityAvailable()) await cancelRoutineReminder(routineId);
};

// Sin conexión: encola la creación en el outbox en vez de fallar. Con conexión: crea directo.
// `navigator.onLine` es la misma señal que usa hooks/useNetworkStatus.ts.
export const createRoutine = async (request: CreateRoutineRequest, reminderAt?: string): Promise<Routine | { queued: true }> => {
  if (!navigator.onLine || useOfflineStatus.getState().offline) {
    await enqueueRoutineCreation(request, reminderAt);
    return { queued: true };
  }
  return remoteRoutines.createRoutine(request);
};

// Drena el outbox cuando vuelve la conectividad (invocado desde el listener de useNetworkStatus
// en el hook de features/routines, nunca automáticamente en background).
export interface SyncResult { synced: number; failed: number; remindersPending: number }
let inFlight: Promise<SyncResult> | null = null;

export const syncOutbox = (): Promise<SyncResult> => {
  if (inFlight) return inFlight;
  inFlight = drainOutbox().finally(() => { inFlight = null; });
  return inFlight;
};

const drainOutbox = async (): Promise<SyncResult> => {
  const owner = localOwner();
  if (!useSessionStore.getState().user) return { synced: 0, failed: 0, remindersPending: 0 };
  if (Capacitor.isNativePlatform()) {
    if (!navigator.onLine) return { synced: 0, failed: 0, remindersPending: 0 };
    await resolveSession();
    if (useOfflineStatus.getState().offline || localOwner() !== owner) return { synced: 0, failed: 0, remindersPending: 0 };
  }
  const entries = await listOutboxEntries();
  let synced = 0;
  let failed = 0;
  for (const entry of entries) {
    if (localOwner() !== owner) break;
    if (!navigator.onLine) { failed += 1; continue; }
    if (entry.attempts >= 5 || entry.uncertain) {
      failed += 1;
      continue;
    }
    if (entry.lastAttemptAt && Date.now() - Date.parse(entry.lastAttemptAt) < 500 * 2 ** Math.max(0, entry.attempts - 1)) {
      failed += 1;
      continue;
    }
    try {
      const routine = entry.remoteRoutine ?? await remoteRoutines.createRoutine(entry.request);
      if (localOwner() !== owner) break;
      // Guardar el resultado remoto antes de efectos opcionales evita recrear la rutina si fallan.
      await updateOutboxEntry(entry.localId, { remoteRoutine: routine });
      if (entry.reminderAt) await saveReminderIntent(routine, entry.reminderAt);
      await removeOutboxEntry(entry.localId);
      synced += 1;
    } catch (error) {
      if (localOwner() !== owner) break;
      failed += 1;
      const attempts = entry.attempts + 1;
      await updateOutboxEntry(entry.localId, { attempts, lastAttemptAt: new Date().toISOString(), uncertain: error instanceof NetworkError || error instanceof TimeoutError });
      break;
    }
  }
  const remindersPending = localOwner() === owner ? await deliverReminderIntents() : 0;
  return { synced, failed, remindersPending };
};

const requireConnection = (): void => {
  if (!navigator.onLine || useOfflineStatus.getState().offline) throw new NetworkError('Conéctate para cambiar la rutina.');
};
