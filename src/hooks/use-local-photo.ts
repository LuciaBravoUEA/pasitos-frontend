import { useEffect, useRef, useState } from 'react';
import { getProfilePhoto, setProfilePhoto } from '../services/local/profilePhoto';
import { getRoutineEvidencePhoto, setRoutineEvidencePhoto } from '../services/local/routineEvidencePhotos';
import { pickPhotoFromGallery, takePhotoWithCamera } from '../services/device/routinePhotoPicker';
import { useCameraPermission } from './use-camera-permission';

export const useLocalPhoto = (id: string, purpose: 'perfil' | 'rutina') => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const camera = useCameraPermission(purpose);
  const load = purpose === 'perfil' ? getProfilePhoto : getRoutineEvidencePhoto;
  const save = purpose === 'perfil' ? setProfilePhoto : setRoutineEvidencePhoto;
  useEffect(() => {
    let current = true;
    setPhoto(null);
    void load(id).then(value => { if (current) setPhoto(value); }).catch(() => {
      if (current) setError('No se pudo recuperar la foto guardada. Puedes elegir otra o continuar sin foto.');
    });
    return () => { current = false; };
  }, [id, load]);
  const choose = async (source: 'camera' | 'gallery'): Promise<void> => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError(null);
    try {
      if (source === 'camera' && !await camera.ensurePermission()) return;
      const path = await (source === 'camera' ? takePhotoWithCamera() : pickPhotoFromGallery());
      if (!path) return;
      await save(id, path);
      setPhoto(await load(id));
    } catch {
      setError('No se pudo guardar la foto. Prueba una imagen JPG, PNG o WebP de hasta 5 MB, revisa el espacio disponible o continúa sin foto.');
    } finally {
      active.current = false;
      setBusy(false);
    }
  };
  const onImageError = (): void => {
    setPhoto(null);
    setError('Esta foto ya no está disponible. Puedes elegir otra.');
  };
  return { photo, busy, message: error ?? camera.message, needsSettings: camera.needsSettings, openSettings: camera.openSettings, choose, onImageError };
};
