import { loadLocalPhoto, saveLocalPhoto } from './local-photos';

// Guarda solo la referencia local (webPath) de la foto de evidencia elegida por rutina — el
// backend real (pasitos-backend) no expone hoy un contrato de subida de archivos (ver
// api-integration.md); por eso esto es puramente una mejora local, nunca se sube a ningún lado.
const KEY_PREFIX = 'pasitos_magicos_routine_evidence_photo_';

export const getRoutineEvidencePhoto = async (routineId: string): Promise<string | null> =>
  loadLocalPhoto(`${KEY_PREFIX}${routineId}`);

export const setRoutineEvidencePhoto = async (routineId: string, webPath: string): Promise<void> => {
  await saveLocalPhoto(`${KEY_PREFIX}${routineId}`, webPath);
};
