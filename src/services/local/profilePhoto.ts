import { loadLocalPhoto, saveLocalPhoto } from './local-photos';
import { removeLocalValue } from './local-database';

const PROFILE_PHOTO_KEY_PREFIX = 'pasitos_magicos_profile_photo_';

const getKey = (userId: string): string => `${PROFILE_PHOTO_KEY_PREFIX}${userId}`;

export const getProfilePhoto = async (userId: string): Promise<string | null> => loadLocalPhoto(getKey(userId));

export const setProfilePhoto = async (userId: string, webPath: string): Promise<void> => {
  await saveLocalPhoto(getKey(userId), webPath);
};

export const removeProfilePhoto = async (userId: string): Promise<void> => {
  await removeLocalValue(getKey(userId));
};
