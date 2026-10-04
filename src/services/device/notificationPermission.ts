import { Capacitor } from '@capacitor/core';
import type { PermissionState } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Único módulo que toca @capacitor/local-notifications para el chequeo/solicitud de permiso —
// nunca se cachea el resultado: cada llamada real a la API nativa se hace en el momento de uso
// (ver services/device/routineReminders.ts), nunca una sola vez al iniciar la app.
export const isNotificationsCapabilityAvailable = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications');

export const checkNotificationPermission = async (): Promise<PermissionState> => {
  if (!isNotificationsCapabilityAvailable()) return 'denied';
  try {
    const status = await LocalNotifications.checkPermissions();
    return status.display;
  } catch {
    throw new Error('Notifications unavailable');
  }
};

export const requestNotificationPermission = async (): Promise<PermissionState> => {
  if (!isNotificationsCapabilityAvailable()) return 'denied';
  try {
    const status = await LocalNotifications.requestPermissions();
    return status.display;
  } catch {
    throw new Error('Notifications unavailable');
  }
};

// El permiso puede estar `granted` pero el usuario apagó las notificaciones del sistema después
// (Ajustes → Apps → Pasitos Mágicos → Notificaciones). Se comprueba aparte y siempre antes de
// agendar — ver matriz de degradación en plan.md §6.
export const areSystemNotificationsEnabled = async (): Promise<boolean> => {
  if (!isNotificationsCapabilityAvailable()) return false;
  try {
    const { value } = await LocalNotifications.areEnabled();
    return value;
  } catch {
    return false;
  }
};
