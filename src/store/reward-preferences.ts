import { create } from 'zustand';
import { getPreference, setPreference } from '../services/storage/preferences';

const SOUND_KEY = 'task_reward_sound';
let load: Promise<void> | undefined;
let writes = Promise.resolve();
let revision = 0;

interface RewardPreferences {
  soundEnabled: boolean;
  loaded: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  toggleSound: () => void;
}

export const useRewardPreferences = create<RewardPreferences>((set, get) => ({
  soundEnabled: true,
  loaded: false,
  error: null,
  hydrate: () => {
    if (get().loaded) return Promise.resolve();
    load ??= getPreference(SOUND_KEY).then(value => {
      if (revision === 0) set({ soundEnabled: value !== 'false' });
    }).catch(() => set({ error: 'No se pudo recuperar la preferencia de sonido.' }))
      .finally(() => set({ loaded: true }));
    return load;
  },
  toggleSound: () => {
    const soundEnabled = !get().soundEnabled;
    const currentRevision = ++revision;
    set({ soundEnabled, error: null });
    writes = writes.then(() => setPreference(SOUND_KEY, String(soundEnabled))).catch(() => {
      if (currentRevision === revision) set({ error: 'El cambio de sonido funciona ahora, pero no se pudo guardar para la próxima vez.' });
    });
  },
}));
