import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { encryptLocalValue, decryptLocalValue } from './local-encryption';

vi.mock('./secureToken', () => ({ getSecureValue: vi.fn().mockResolvedValue(null), setSecureValue: vi.fn().mockResolvedValue(undefined) }));
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('cifrado de datos educativos', () => {
  it('cifra con nonce distinto y recupera datos solo con su ámbito original', async () => {
    const first = await encryptLocalValue('actividad privada', 'student:progress');
    const second = await encryptLocalValue('actividad privada', 'student:progress');
    expect(first).not.toContain('actividad privada');
    expect(first).not.toBe(second);
    expect(await decryptLocalValue(first, 'student:progress')).toBe('actividad privada');
    expect(await decryptLocalValue(first, 'another:progress')).toBeNull();
  });
  it('rechaza copias antiguas en claro y payloads manipulados', async () => {
    expect(await decryptLocalValue('dato anterior sin dueño', 'student')).toBeNull();
    const encrypted = await encryptLocalValue('privado', 'student');
    expect(await decryptLocalValue(encrypted.slice(0, -4) + 'AAAA', 'student')).toBeNull();
  });
});
