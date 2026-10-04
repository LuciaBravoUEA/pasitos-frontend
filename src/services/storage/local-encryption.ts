import { Capacitor } from '@capacitor/core';
import { getSecureValue, setSecureValue } from './secureToken';

const KEY = 'pasitos_magicos_local_encryption_key';
let pendingKey: Promise<CryptoKey> | undefined;
const encode = (bytes: Uint8Array): string => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
const decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), char => char.charCodeAt(0));

const getKey = (): Promise<CryptoKey> => {
  if (!pendingKey) {
    pendingKey = (async () => {
      const stored = await getSecureValue(KEY);
      const bytes = stored ? decode(stored) : crypto.getRandomValues(new Uint8Array(32));
      if (!stored) await setSecureValue(KEY, encode(bytes));
      return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
    })().catch(error => { pendingKey = undefined; throw error; });
  }
  return pendingKey;
};

export const encryptLocalValue = async (value: string, scope: string): Promise<string> => {
  if (!Capacitor.isNativePlatform()) return value;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(scope) }, await getKey(), new TextEncoder().encode(value));
  return `encrypted-v1:${encode(iv)}:${encode(new Uint8Array(encrypted))}`;
};

export const decryptLocalValue = async (value: string | null, scope: string): Promise<string | null> => {
  if (!value || !Capacitor.isNativePlatform()) return value;
  if (!value.startsWith('encrypted-v1:')) return null;
  const [, iv, payload] = value.split(':');
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(iv), additionalData: new TextEncoder().encode(scope) }, await getKey(), decode(payload));
    return new TextDecoder().decode(decrypted);
  } catch { return null; }
};
