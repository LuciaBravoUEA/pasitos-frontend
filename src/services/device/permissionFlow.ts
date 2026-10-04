import type { PermissionState } from '@capacitor/core';

// Resultado observable del flujo, ya traducido a lo que la UI necesita reaccionar — separado de
// PermissionState nativo para poder probarlo sin depender de Capacitor real (ver .test.ts).
export type PermissionFlowResult = 'granted' | 'awaiting-user' | 'permanently-denied' | 'unavailable';

export interface PermissionFlowDeps {
  available?: () => boolean;
  check: () => Promise<PermissionState>;
  request: () => Promise<PermissionState>;
  // Debe mostrar la explicación y devolver si la persona usuaria acepta continuar hacia el
  // diálogo real del sistema (permite cancelar sin disparar el prompt nativo).
  showRationale: (message: string) => Promise<boolean>;
  rationale: string;
  rationaleRepeat: string;
}

// Lógica pura de los 4 estados de permiso — nunca solicita si ya está `denied` (el SO no vuelve
// a mostrar el diálogo), y siempre antepone una explicación propia antes del diálogo nativo.
// Ver spec/features/011-capacidades-dispositivo/plan.md §2.
export const runPermissionFlow = async (deps: PermissionFlowDeps): Promise<PermissionFlowResult> => {
  try {
    if (deps.available && !deps.available()) return 'unavailable';
    const current = await deps.check();

    if (current === 'granted') return 'granted';
    if (current === 'denied') return 'permanently-denied';

    const message = current === 'prompt-with-rationale' ? deps.rationaleRepeat : deps.rationale;
    const wantsToContinue = await deps.showRationale(message);
    if (!wantsToContinue) return 'awaiting-user';

    const result = await deps.request();
    if (result === 'granted') return 'granted';
    if (result === 'denied') return 'permanently-denied';
    return 'awaiting-user';
  } catch {
    return 'unavailable';
  }
};
