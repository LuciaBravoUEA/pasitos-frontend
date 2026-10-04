import { afterEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { watchSyncLifecycle } from './sync-lifecycle';
import { waitFor } from '@testing-library/react';

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }));
afterEach(() => { vi.restoreAllMocks(); });

describe('ciclo de sincronización', () => {
  it('sincroniza al abrir, reconectar y volver visible; retira listeners', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    const sync = vi.fn();
    const stop = watchSyncLifecycle(sync);
    expect(sync).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('online'));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sync).toHaveBeenCalledTimes(3);
    stop();
    window.dispatchEvent(new Event('online'));
    expect(sync).toHaveBeenCalledTimes(3);
  });

  it('retira la suscripción nativa aunque se complete después del desmontaje', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.mocked(App.addListener).mockResolvedValue({ remove });
    const stop = watchSyncLifecycle(vi.fn());
    stop();
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
  });
});
