import { useState } from 'react';
import { runPermissionFlow } from '../services/device/permissionFlow';
import { checkCameraPermission, requestCameraPermission, isPhotoPickerAvailable } from '../services/device/routinePhotoPicker';
import { openAppSettings } from '../services/device/app-settings';
import { usePermissionDialog } from './use-permission-dialog';

export const useCameraPermission = (purpose: 'perfil' | 'rutina') => {
  const showRationale = usePermissionDialog();
  const [message, setMessage] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);
  const ensurePermission = async (): Promise<boolean> => {
    setMessage(null);
    setNeedsSettings(false);
    const detail = purpose === 'perfil' ? 'tu foto de perfil' : 'una foto de evidencia de esta rutina';
    const result = await runPermissionFlow({
      available: isPhotoPickerAvailable,
      check: checkCameraPermission,
      request: requestCameraPermission,
      showRationale,
      rationale: `Pasitos Mágicos usará la cámara para tomar ${detail}. La foto queda solo en este dispositivo. Puedes continuar sin foto.`,
      rationaleRepeat: `Antes rechazaste la cámara. Si ahora quieres tomar ${detail}, puedes permitirla. Seguir sin foto también está bien.`,
    });
    if (result === 'granted') return true;
    setNeedsSettings(result === 'permanently-denied');
    setMessage(result === 'unavailable' ? 'La cámara no está disponible. Puedes continuar sin foto.' :
      result === 'permanently-denied' ? 'La cámara está desactivada. Puedes habilitarla en los ajustes o continuar sin foto.' :
        'Puedes continuar sin foto y volver a intentarlo cuando quieras.');
    return false;
  };
  const openSettings = async (): Promise<void> => {
    if (!await openAppSettings()) setMessage('No se pudieron abrir los ajustes. Abre Ajustes del dispositivo y busca Pasitos Mágicos.');
  };
  return { ensurePermission, message, needsSettings, openSettings };
};
