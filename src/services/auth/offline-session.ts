import { Capacitor } from '@capacitor/core';
import { z } from 'zod';
import { getSession } from '../api/endpoints/auth';
import { NetworkError, TimeoutError } from '../api/errorMapper';
import { getSecureValue, setSecureValue, getSessionToken } from '../storage/secureToken';
import { sessionUserSchema } from '../../types/api/auth';
import { getSessionGeneration } from './session-generation';
import { useOfflineStatus } from '../../store/offline-status';
import { logger } from '../telemetry/logger';

const KEY = 'pasitos_magicos_offline_session';
const TTL = 24 * 60 * 60 * 1000;
const snapshotSchema = z.object({ user: sessionUserSchema, token: z.string(), expiresAt: z.number(), savedAt: z.number() });

export const resolveSession = async (signal?: AbortSignal) => {
  const generation = getSessionGeneration();
  const token = Capacitor.isNativePlatform() ? await getSessionToken() : null;
  try {
    if (!navigator.onLine) throw new NetworkError('Necesitas conexión para iniciar sesión.');
    const user = await getSession(signal);
    if (signal?.aborted || generation !== getSessionGeneration()) throw new Error('Sesión anterior');
    const until = Math.min(user.exp ? user.exp * 1000 : 0, Date.now() + TTL);
    if (Capacitor.isNativePlatform() && token && until > Date.now()) {
      await setSecureValue(KEY, JSON.stringify({ user, token, expiresAt: until, savedAt: Date.now() })).catch(() => logger.warn('No se pudo guardar el acceso sin conexión'));
    }
    useOfflineStatus.getState().setStatus(false, until);
    return user;
  } catch (error) {
    if (!(error instanceof NetworkError || error instanceof TimeoutError)) throw error;
    useOfflineStatus.getState().setStatus(true, useOfflineStatus.getState().validatedUntil);
    if (!Capacitor.isNativePlatform() || !token) throw error;
    let snapshot: z.infer<typeof snapshotSchema>;
    try { snapshot = snapshotSchema.parse(JSON.parse(await getSecureValue(KEY) ?? 'null')); }
    catch { throw error; }
    const now = Date.now();
    if (signal?.aborted || generation !== getSessionGeneration() || snapshot.token !== token || snapshot.expiresAt <= now || snapshot.savedAt > now || now - snapshot.savedAt >= TTL) throw error;
    useOfflineStatus.getState().setStatus(true, snapshot.expiresAt);
    return snapshot.user;
  }
};
