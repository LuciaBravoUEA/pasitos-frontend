import { getPreference, removePreference } from '../storage/preferences';
import { useSessionStore } from '../../store/sessionStore';
import { Capacitor } from '@capacitor/core';
import { decryptLocalValue, encryptLocalValue } from '../storage/local-encryption';

const STORE = 'records';
let connection: Promise<IDBDatabase> | undefined;
export const localOwner = (): string => useSessionStore.getState().user?.id ?? 'device';

const encryptExistingRecords = async (db: IDBDatabase): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  const records = await new Promise<{ key: string; value: string }[]>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).openCursor();
    const rows: { key: string; value: string }[] = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (typeof cursor.value === 'string' && !cursor.value.startsWith('encrypted-v1:')) rows.push({ key: String(cursor.key), value: cursor.value });
      cursor.continue();
    };
    transaction.oncomplete = () => resolve(rows);
    transaction.onabort = () => reject(transaction.error);
  });
  for (const row of records) {
    const encrypted = await encryptLocalValue(row.value, row.key);
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      const request = store.get(row.key);
      request.onsuccess = () => { if (request.result === row.value) store.put(encrypted, row.key); };
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
  }
};

const openDatabase = (): Promise<IDBDatabase> => {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('pasitos-magicos-local', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Local database blocked'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = undefined; };
      void encryptExistingRecords(db).then(() => resolve(db)).catch(error => { db.close(); reject(error); });
    };
  });
  connection.catch(() => { connection = undefined; });
  return connection;
};

const readRawValue = async (key: string): Promise<string | null> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(key);
    transaction.oncomplete = () => resolve(typeof request.result === 'string' ? request.result : null);
    transaction.onabort = () => reject(transaction.error ?? new Error('Local read failed'));
    transaction.onerror = () => reject(transaction.error);
  });
};

const changeRawValue = async (key: string, change: (value: string | null) => string | null): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = store.get(key);
    request.onsuccess = () => {
      try {
        const value = change(typeof request.result === 'string' ? request.result : null);
        if (value === null) store.delete(key);
        else store.put(value, key);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('Local write failed'));
    transaction.onerror = () => reject(transaction.error);
  });
};

const readValue = async (key: string): Promise<string | null> => decryptLocalValue(await readRawValue(key), key);
let changes: Promise<void> = Promise.resolve();
const changeValue = (key: string, change: (value: string | null) => string | null): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return changeRawValue(key, change);
  const owner = localOwner();
  const operation = changes.then(async () => {
    if (localOwner() !== owner) throw new Error('Sesión anterior');
    const next = change(await readValue(key));
    const encrypted = next === null ? null : await encryptLocalValue(next, key);
    await changeRawValue(key, () => {
      if (localOwner() !== owner) throw new Error('Sesión anterior');
      return encrypted;
    });
  });
  changes = operation.catch(() => undefined);
  return operation;
};

export const getLocalValue = async (key: string, owner = localOwner()): Promise<string | null> => {
  const scopedKey = `${owner}:${key}`;
  const current = await readValue(scopedKey);
  if (current !== null) return current;
  // Las copias antiguas en claro no tienen identidad verificable: no se atribuyen a una cuenta nativa.
  if (Capacitor.isNativePlatform()) return null;
  const legacy = await getPreference(key);
  if (legacy === null || localOwner() !== owner) return null;
  // No se elimina la copia anterior hasta confirmar la transacción de migración.
  await changeValue(scopedKey, value => value ?? legacy);
  await removePreference(key);
  return readValue(scopedKey);
};

export const updateLocalValue = async (key: string, change: (value: string | null) => string | null, owner = localOwner()): Promise<void> => {
  await getLocalValue(key, owner);
  if (localOwner() !== owner) throw new Error('Session changed');
  await changeValue(`${owner}:${key}`, value => {
    if (localOwner() !== owner) throw new Error('Session changed');
    return change(value);
  });
};

export const setLocalValue = async (key: string, value: string, owner = localOwner()): Promise<void> =>
  updateLocalValue(key, () => value, owner);

export const removeLocalValue = async (key: string): Promise<void> => updateLocalValue(key, () => null);

export const removeLocalValuesWithPrefix = async (prefix: string): Promise<void> => {
  const owner = localOwner();
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const request = transaction.objectStore(STORE).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(`${owner}:${prefix}`)) cursor.delete();
      cursor.continue();
    };
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const clearLocalDatabase = async (): Promise<void> => {
  await changes;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
};
