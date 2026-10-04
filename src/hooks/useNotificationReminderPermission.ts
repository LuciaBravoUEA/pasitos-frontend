import { useCallback, useState } from 'react';
import { openAppSettings } from '../services/device/app-settings';
import { usePermissionDialog } from './use-permission-dialog';
import {
  areSystemNotificationsEnabled,
  checkNotificationPermission,
  requestNotificationPermission,
  isNotificationsCapabilityAvailable,
} from '../services/device/notificationPermission';
import {
  NOTIFICATION_DENIED_PERMANENTLY,
  NOTIFICATION_RATIONALE,
  NOTIFICATION_RATIONALE_REPEAT,
  NOTIFICATION_SYSTEM_DISABLED,
} from '../services/device/permissionCopy';
import { runPermissionFlow, type PermissionFlowResult } from '../services/device/permissionFlow';

export interface UseNotificationReminderPermission {
  // Ejecuta el flujo completo (rationale → diálogo del sistema → 4 reacciones) y devuelve si se
  // puede proceder a agendar. Comprueba el estado en CADA llamada, nunca lo cachea.
  ensurePermission: () => Promise<boolean>;
  // Banner de degradación a mostrar cuando `ensurePermission` devuelve false.
  degradationMessage: string | null;
  openSettings: () => Promise<void>;
}

// Hook específico del recordatorio de rutinas (feature 011) — envuelve el flujo genérico de
// permisos (services/device/permissionFlow.ts) con la UI real: IonAlert como rationale y
// capacitor-native-settings como salida ante denegación permanente.
export const useNotificationReminderPermission = (): UseNotificationReminderPermission => {
  const showRationale = usePermissionDialog();
  const [degradationMessage, setDegradationMessage] = useState<string | null>(null);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    setDegradationMessage(null);
    const flowResult: PermissionFlowResult = await runPermissionFlow({
      available: isNotificationsCapabilityAvailable,
      check: checkNotificationPermission,
      request: requestNotificationPermission,
      showRationale,
      rationale: NOTIFICATION_RATIONALE,
      rationaleRepeat: NOTIFICATION_RATIONALE_REPEAT,
    });

    if (flowResult === 'permanently-denied' || flowResult === 'unavailable') {
      setDegradationMessage(flowResult === 'unavailable' ? 'Los recordatorios no están disponibles en este dispositivo.' : NOTIFICATION_DENIED_PERMANENTLY);
      return false;
    }
    if (flowResult === 'awaiting-user') {
      setDegradationMessage('La rutina se guardará sin activar avisos por ahora.');
      return false;
    }

    // Permiso concedido a nivel de app — falta comprobar que el usuario no apagó las
    // notificaciones del sistema después (ver matriz de degradación, plan.md §6).
    const systemEnabled = await areSystemNotificationsEnabled();
    if (!systemEnabled) {
      setDegradationMessage(NOTIFICATION_SYSTEM_DISABLED);
      return false;
    }
    return true;
  }, [showRationale]);

  const openSettings = useCallback(async (): Promise<void> => {
    if (!await openAppSettings(true)) setDegradationMessage('Abre Ajustes del dispositivo, busca Pasitos Mágicos y activa sus notificaciones.');
  }, []);

  return { ensurePermission, degradationMessage, openSettings };
};
