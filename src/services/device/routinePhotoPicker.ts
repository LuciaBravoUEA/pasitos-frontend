import { Capacitor } from '@capacitor/core';
import type { PermissionState } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

// Único módulo que toca @capacitor/camera. La galería usa Photo Picker y la cámara usa
// `takePhoto`; nunca se guarda automáticamente en la galería.
export const isPhotoPickerAvailable = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Camera');

const cameraState = (state: PermissionState | 'limited'): PermissionState => {
  if (state === 'limited') throw new Error('Unsupported camera permission state');
  return state;
};

export const checkCameraPermission = async (): Promise<PermissionState> => {
  if (!isPhotoPickerAvailable()) return 'denied' as const;
  try {
    return cameraState((await Camera.checkPermissions()).camera);
  } catch {
    throw new Error('Camera unavailable');
  }
};

export const requestCameraPermission = async (): Promise<PermissionState> => {
  if (!isPhotoPickerAvailable()) return 'denied' as const;
  try {
    return cameraState((await Camera.requestPermissions({ permissions: ['camera'] })).camera);
  } catch {
    throw new Error('Camera unavailable');
  }
};

export const pickRoutineEvidencePhoto = async (): Promise<string | null> => {
  if (!isPhotoPickerAvailable()) return null;
  try {
    const { results } = await Camera.chooseFromGallery({ quality: 70 });
    return results[0]?.webPath ?? null;
  } catch (error) {
    if (isCancellation(error)) return null;
    throw new Error('No se pudo abrir la foto. Puedes continuar sin ella.');
  }
};

export const pickPhotoFromGallery = pickRoutineEvidencePhoto;

export const takeRoutineEvidencePhoto = async (): Promise<string | null> => {
  if (!isPhotoPickerAvailable()) return null;
  try {
    if (await checkCameraPermission() !== 'granted') throw new Error('Camera permission revoked');
    const result = await Camera.takePhoto({ quality: 70, saveToGallery: false, editable: 'no' });
    return result.webPath ?? null;
  } catch (error) {
    if (isCancellation(error)) return null;
    throw new Error('No se pudo tomar la foto. Revisa el permiso de cámara o continúa sin foto.');
  }
};

export const takePhotoWithCamera = takeRoutineEvidencePhoto;

const isCancellation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error &&
  ['OS-PLUG-CAMR-0006', 'OS-PLUG-CAMR-0020'].includes(String(error.code));
