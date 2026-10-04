import { Preferences } from '@capacitor/preferences';

const TRACKED_KEYS = 'pasitos_magicos_local_keys';

const readTrackedKeys = async (): Promise<string[]> => {
  const { value } = await Preferences.get({ key: TRACKED_KEYS });
  if (!value) return [];
  try {
    const keys: unknown = JSON.parse(value);
    return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
};

// Solo para datos locales no sensibles. Sesión y tokens nunca van aquí.
export const getPreference = async (key: string): Promise<string | null> => {
  const { value } = await Preferences.get({ key });
  return value;
};

export const setPreference = async (key: string, value: string): Promise<void> => {
  await Preferences.set({ key, value });
  if (key !== TRACKED_KEYS) {
    const keys = await readTrackedKeys();
    if (!keys.includes(key)) await Preferences.set({ key: TRACKED_KEYS, value: JSON.stringify([...keys, key]) });
  }
};

export const removePreference = async (key: string): Promise<void> => {
  await Preferences.remove({ key });
};

export const clearLocalPreferences = async (): Promise<void> => {
  const keys = await readTrackedKeys();
  await Promise.all(keys.map(key => Preferences.remove({ key })));
  await Preferences.remove({ key: TRACKED_KEYS });
};
