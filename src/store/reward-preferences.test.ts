import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/storage/preferences', () => ({ getPreference: vi.fn(), setPreference: vi.fn() }));

describe('Preferencia de sonido', () => {
  it('recupera el silencio guardado y guarda la nueva elección', async () => {
    vi.resetModules();
    const storage = await import('../services/storage/preferences');
    vi.mocked(storage.getPreference).mockResolvedValue('false');
    vi.mocked(storage.setPreference).mockResolvedValue(undefined);
    const { useRewardPreferences: store } = await import('./reward-preferences');
    await store.getState().hydrate();
    expect(store.getState().soundEnabled).toBe(false);
    store.getState().toggleSound();
    await vi.waitFor(() => expect(storage.setPreference).toHaveBeenCalledWith('task_reward_sound', 'true'));
  });

  it('mantiene la elección en memoria y avisa si no puede persistirla', async () => {
    vi.resetModules();
    const storage = await import('../services/storage/preferences');
    vi.mocked(storage.getPreference).mockResolvedValue(null);
    vi.mocked(storage.setPreference).mockRejectedValue(new Error('storage unavailable'));
    const { useRewardPreferences: store } = await import('./reward-preferences');
    await store.getState().hydrate();
    store.getState().toggleSound();
    expect(store.getState().soundEnabled).toBe(false);
    await vi.waitFor(() => expect(store.getState().error).toContain('no se pudo guardar'));
  });
});
