import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryInit = vi.fn();
const sentrySetUser = vi.fn();
const sentryCaptureException = vi.fn();

vi.mock('@sentry/capacitor', () => ({
  init: sentryInit,
  setUser: sentrySetUser,
  captureException: sentryCaptureException,
}));
vi.mock('@sentry/react', () => ({ init: vi.fn() }));

describe('monitoring', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('no inicializa nada sin VITE_SENTRY_DSN configurado', async () => {
    vi.doMock('../../config/env', () => ({ env: { monitoringDsn: undefined, isProduction: false, appVersion: '1.0.0' } }));
    const { initMonitoring, setMonitoringUser, captureMonitoringError } = await import('./monitoring');

    initMonitoring();
    setMonitoringUser('user-1');
    captureMonitoringError(new Error('falla'));

    expect(sentryInit).not.toHaveBeenCalled();
    expect(sentrySetUser).not.toHaveBeenCalled();
    expect(sentryCaptureException).not.toHaveBeenCalled();
  });

  it('inicializa con el número de versión como release y sin muestreo de trazas', async () => {
    vi.doMock('../../config/env', () => ({ env: { monitoringDsn: 'https://example.test/1', isProduction: true, appVersion: '2.3.4' } }));
    const { initMonitoring } = await import('./monitoring');

    initMonitoring();

    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://example.test/1', release: '2.3.4', environment: 'production', tracesSampleRate: 0 }),
      expect.any(Function),
    );
  });

  it('redacta el encabezado Authorization y el correo del usuario antes de enviar un evento', async () => {
    vi.doMock('../../config/env', () => ({ env: { monitoringDsn: 'https://example.test/1', isProduction: false, appVersion: '1.0.0' } }));
    const { initMonitoring } = await import('./monitoring');

    initMonitoring();
    const { beforeSend } = sentryInit.mock.calls[0][0];
    const sanitized = beforeSend({
      request: { headers: { Authorization: 'Bearer secreto', 'X-Correlation-ID': 'abc' } },
      user: { id: 'user-1', email: 'evam@pasitosmagicos.local' },
    });

    expect(sanitized.request.headers.Authorization).toBe('[REDACTED]');
    expect(sanitized.request.headers['X-Correlation-ID']).toBe('abc');
    expect(sanitized.user.email).toBeUndefined();
    expect(sanitized.user.id).toBe('user-1');
  });

  it('usa el identificador interno del usuario, nunca su correo', async () => {
    vi.doMock('../../config/env', () => ({ env: { monitoringDsn: 'https://example.test/1', isProduction: false, appVersion: '1.0.0' } }));
    const { initMonitoring, setMonitoringUser } = await import('./monitoring');

    initMonitoring();
    setMonitoringUser('user-42');

    expect(sentrySetUser).toHaveBeenCalledWith({ id: 'user-42' });
  });

  it('adjunta contexto redactado (nunca tokens ni contraseñas) al capturar un error', async () => {
    vi.doMock('../../config/env', () => ({ env: { monitoringDsn: 'https://example.test/1', isProduction: false, appVersion: '1.0.0' } }));
    const { initMonitoring, captureMonitoringError } = await import('./monitoring');

    initMonitoring();
    const error = new Error('fallo de prueba');
    captureMonitoringError(error, { token: 'secret-value', url: '/rutinas' });

    expect(sentryCaptureException).toHaveBeenCalledWith(error, { extra: { token: '[REDACTED]', url: '/rutinas' } });
  });
});
