import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const watchSyncLifecycle = (sync: () => void): (() => void) => {
  let disposed = false;
  let removeNative: (() => Promise<void>) | undefined;
  const resume = (): void => { if (document.visibilityState === 'visible') sync(); };
  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', resume);
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('App')) {
    void App.addListener('appStateChange', state => { if (state.isActive && !disposed) sync(); })
      .then(handle => {
        if (disposed) void handle.remove().catch(() => undefined);
        else removeNative = () => handle.remove();
      }).catch(() => undefined);
  }
  sync();
  return () => {
    disposed = true;
    window.removeEventListener('online', sync);
    document.removeEventListener('visibilitychange', resume);
    void removeNative?.().catch(() => undefined);
  };
};
