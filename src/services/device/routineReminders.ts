import { LocalNotifications } from '@capacitor/local-notifications';
import type { Routine } from '../../types/api/routines';
import { Capacitor } from '@capacitor/core';
import { checkNotificationPermission, areSystemNotificationsEnabled, isNotificationsCapabilityAvailable } from './notificationPermission';

const CHANNEL_ID = 'routine-reminders';

// Se crea perezosamente, la primera vez que alguien activa un recordatorio — nunca en el
// arranque global de la app (main.tsx no la toca). Idempotente: createChannel con el mismo id
// no duplica el canal en Android.
const ensureChannel = async (): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Recordatorios de rutinas',
    description: 'Avisos para no olvidar una rutina pendiente de Pasitos Mágicos.',
    importance: 3,
    visibility: 1,
  });
  const { channels } = await LocalNotifications.listChannels();
  if (channels.some(channel => channel.id === CHANNEL_ID && channel.importance === 0)) throw new Error('Notification channel disabled');
};

const routineNotificationId = (routineId: string): number => {
  // Los ids de @capacitor/local-notifications son enteros de 32 bits — se deriva uno estable a
  // partir del uuid de la rutina, en vez de guardar un contador aparte.
  let hash = 0;
  for (let index = 0; index < routineId.length; index += 1) {
    hash = (hash * 31 + routineId.charCodeAt(index)) | 0;
  }
  return (hash & 0x7fffffff) || 1;
};

// `isExactNotification: false` a propósito — el recordatorio es aproximado, nunca crítico al
// minuto, así que nunca se solicita el permiso de alarmas exactas (ver spec.md).
export const scheduleRoutineReminder = async (routine: Pick<Routine, 'id' | 'title'>, at: Date): Promise<void> => {
  if (!isNotificationsCapabilityAvailable() || await checkNotificationPermission() !== 'granted' || !await areSystemNotificationsEnabled()) {
    throw new Error('Notification permission unavailable');
  }
  if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now()) throw new Error('Reminder expired');
  await ensureChannel();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: routineNotificationId(routine.id),
        title: 'Rutina pendiente',
        body: `Es un buen momento para: ${routine.title}`,
        channelId: CHANNEL_ID,
        schedule: { at, allowWhileIdle: true },
        isExactNotification: false,
      },
    ],
  });
};

export const cancelRoutineReminder = async (routineId: string): Promise<void> => {
  await LocalNotifications.cancel({ notifications: [{ id: routineNotificationId(routineId) }] });
};

export const cancelAllRoutineReminders = async (): Promise<void> => {
  if (isNotificationsCapabilityAvailable()) await LocalNotifications.cancelAll();
};
