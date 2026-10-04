import { create } from 'zustand';

export const useSyncStatusStore = create<{ message: string | null; setMessage: (message: string | null) => void }>(set => ({
  message: null,
  setMessage: message => set({ message }),
}));
