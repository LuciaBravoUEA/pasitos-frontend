import { getLocalValue as getPreference, setLocalValue as setPreference } from './local-database';
import { routineDetailSchema, routineSchema, type Routine, type RoutineDetail } from '../../types/api/routines';
import { z } from 'zod';
import type { PaginationMeta } from '../../types/api/common';
import { removeLocalValue, removeLocalValuesWithPrefix } from './local-database';

// En nativo la base local cifra los valores con una clave protegida por Keystore/Keychain.
const LIST_CACHE_KEY = 'pasitos_magicos_routines_cache_list';
const DETAIL_CACHE_KEY_PREFIX = 'pasitos_magicos_routines_cache_detail_';
export const LOCAL_SCHEMA_VERSION = 1;
export const LOCAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedList {
  schemaVersion: number;
  page: number;
  routines: Routine[];
  lastSyncedAt: string;
  meta?: PaginationMeta;
}

export interface LocalCacheStatus {
  lastSyncedAt: string | null;
  isStale: boolean;
}

const parseCachedList = (raw: string | null): CachedList | null => {
  if (!raw) return null;
  try {
    const parsed = z.object({ schemaVersion: z.literal(LOCAL_SCHEMA_VERSION), page: z.number(), routines: routineSchema.array(), lastSyncedAt: z.string(), meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), totalPages: z.number() }).optional() }).parse(JSON.parse(raw));
    const age = Date.now() - Date.parse(parsed.lastSyncedAt);
    if (!Number.isFinite(age) || age < 0 || age >= LOCAL_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getCachedRoutineList = async (page: number): Promise<Routine[] | null> => {
  const raw = await getPreference(`${LIST_CACHE_KEY}_${page}`);
  return parseCachedList(raw)?.routines ?? null;
};

export const getCachedRoutinePage = async (page: number) => {
  const cached = parseCachedList(await getPreference(`${LIST_CACHE_KEY}_${page}`));
  return cached?.meta ? { data: cached.routines, meta: cached.meta } : null;
};

export const getRoutineListCacheStatus = async (page: number): Promise<LocalCacheStatus> => {
  const cached = parseCachedList(await getPreference(`${LIST_CACHE_KEY}_${page}`));
  if (!cached) return { lastSyncedAt: null, isStale: true };
  return { lastSyncedAt: cached.lastSyncedAt, isStale: Date.now() - Date.parse(cached.lastSyncedAt) > LOCAL_CACHE_TTL_MS };
};

export const setCachedRoutineList = async (page: number, routines: Routine[], meta?: PaginationMeta): Promise<void> => {
  const payload: CachedList = { schemaVersion: LOCAL_SCHEMA_VERSION, page, routines, meta, lastSyncedAt: new Date().toISOString() };
  await setPreference(`${LIST_CACHE_KEY}_${page}`, JSON.stringify(payload));
};

export const getCachedRoutine = async (routineId: string): Promise<RoutineDetail | null> => {
  const raw = await getPreference(`${DETAIL_CACHE_KEY_PREFIX}${routineId}`);
  if (!raw) return null;
  try {
    const parsed = z.object({ value: routineDetailSchema, savedAt: z.number() }).parse(JSON.parse(raw));
    const age = Date.now() - parsed.savedAt;
    return age >= 0 && age < LOCAL_CACHE_TTL_MS ? parsed.value : null;
  } catch {
    return null;
  }
};

export const invalidateRoutineCache = async (routineId: string): Promise<void> => {
  await removeLocalValuesWithPrefix(LIST_CACHE_KEY);
  await removeLocalValue(`${DETAIL_CACHE_KEY_PREFIX}${routineId}`);
};

export const setCachedRoutine = async (routine: Routine): Promise<void> => {
  await setPreference(`${DETAIL_CACHE_KEY_PREFIX}${routine.id}`, JSON.stringify({ value: routine, savedAt: Date.now() }));
};
