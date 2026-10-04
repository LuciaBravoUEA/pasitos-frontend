import { describe, expect, it, vi } from 'vitest';
import { runPermissionFlow } from './permissionFlow';

const baseDeps = {
  rationale: 'rationale',
  rationaleRepeat: 'rationale-repeat',
};

describe('runPermissionFlow', () => {
  it('distingue capacidad ausente y no intenta solicitar permiso', async () => {
    const check = vi.fn();
    const result = await runPermissionFlow({ ...baseDeps, available: () => false, check, request: vi.fn(), showRationale: vi.fn() });
    expect(result).toBe('unavailable');
    expect(check).not.toHaveBeenCalled();
  });

  it('un fallo nativo se degrada sin confundirse con denegación permanente', async () => {
    const result = await runPermissionFlow({ ...baseDeps, check: async () => { throw new Error('native'); }, request: vi.fn(), showRationale: vi.fn() });
    expect(result).toBe('unavailable');
  });
  it('resuelve granted sin mostrar rationale ni solicitar de nuevo', async () => {
    const showRationale = vi.fn();
    const request = vi.fn();
    const result = await runPermissionFlow({
      ...baseDeps,
      check: async () => 'granted',
      request,
      showRationale,
    });

    expect(result).toBe('granted');
    expect(showRationale).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('resuelve permanently-denied sin volver a solicitar (el SO ya no muestra diálogo)', async () => {
    const request = vi.fn();
    const result = await runPermissionFlow({
      ...baseDeps,
      check: async () => 'denied',
      request,
      showRationale: async () => true,
    });

    expect(result).toBe('permanently-denied');
    expect(request).not.toHaveBeenCalled();
  });

  it('muestra el rationale inicial en "prompt" y solicita si la persona acepta', async () => {
    const showRationale = vi.fn().mockResolvedValue(true);
    const result = await runPermissionFlow({
      ...baseDeps,
      check: async () => 'prompt',
      request: async () => 'granted',
      showRationale,
    });

    expect(showRationale).toHaveBeenCalledWith('rationale');
    expect(result).toBe('granted');
  });

  it('muestra el rationale insistente en "prompt-with-rationale"', async () => {
    const showRationale = vi.fn().mockResolvedValue(true);
    await runPermissionFlow({
      ...baseDeps,
      check: async () => 'prompt-with-rationale',
      request: async () => 'denied',
      showRationale,
    });

    expect(showRationale).toHaveBeenCalledWith('rationale-repeat');
  });

  it('no solicita el permiso si la persona cancela el rationale', async () => {
    const request = vi.fn();
    const result = await runPermissionFlow({
      ...baseDeps,
      check: async () => 'prompt',
      request,
      showRationale: async () => false,
    });

    expect(result).toBe('awaiting-user');
    expect(request).not.toHaveBeenCalled();
  });
});
