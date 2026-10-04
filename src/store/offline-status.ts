import { create } from 'zustand';

export const useOfflineStatus = create<{ offline: boolean; validatedUntil: number; setStatus: (offline: boolean, validatedUntil?: number) => void }>(set => ({
  offline: !navigator.onLine,
  validatedUntil: 0,
  setStatus: (offline, validatedUntil = 0) => set({ offline, validatedUntil }),
}));
