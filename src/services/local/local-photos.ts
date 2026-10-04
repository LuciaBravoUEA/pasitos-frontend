import { readLocalPhoto } from '../api/local-photo';
import { getLocalValue, localOwner, setLocalValue } from './local-database';

export const saveLocalPhoto = async (key: string, webPath: string): Promise<void> => {
  const owner = localOwner();
  const image = await readLocalPhoto(webPath);
  await setLocalValue(key, image, owner);
};

export const loadLocalPhoto = async (key: string): Promise<string | null> => {
  const owner = localOwner();
  const value = await getLocalValue(key, owner);
  if (!value || value.startsWith('data:image/')) return value;
  const image = await readLocalPhoto(value);
  await setLocalValue(key, image, owner);
  return image;
};
