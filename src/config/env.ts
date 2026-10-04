interface AppEnv {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  isProduction: boolean;
  isDevelopment: boolean;
  // Monitoreo de fallos (Sentry) — opcional: sin DSN, `monitoring.ts` no inicializa nada.
  monitoringDsn?: string;
  appVersion: string;
}

const requireEnv = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${key} no está definida. Revisa tu archivo .env (ver .env.example).`);
  }
  return value;
};

const readEnv = (): AppEnv => ({
  apiBaseUrl: requireEnv('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  monitoringDsn: import.meta.env.VITE_SENTRY_DSN,
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
});

export const env = readEnv();

// Hosts de depuración documentados (emulador Android / simulador iOS) que nunca reciben
// tráfico real de producción — única excepción aceptada al requisito de HTTPS obligatorio.
// Ver spec/constitution/api-integration.md §3 (gap 1: server.androidScheme) y .env.production.
const HTTPS_EXCEPTION_HOSTS = ['10.0.2.2', 'localhost', '127.0.0.1'];

const isHttpsExceptionAllowed = (baseUrl: string): boolean => {
  try {
    const { hostname } = new URL(baseUrl);
    return HTTPS_EXCEPTION_HOSTS.includes(hostname);
  } catch {
    // baseUrl relativo (ej. "/api", solo dev con proxy de Vite) — no aplica el chequeo de host.
    return true;
  }
};

// Invocar en el arranque de la app (main.tsx). Falla rápido en vez de distribuir un build de
// producción que hable HTTP con un backend real.
export const assertSecureProductionConfig = (): void => {
  if (!env.isProduction) return;
  const usesHttps = env.apiBaseUrl.startsWith('https://');
  if (!usesHttps && !isHttpsExceptionAllowed(env.apiBaseUrl)) {
    throw new Error(
      `Configuración insegura: VITE_API_BASE_URL ("${env.apiBaseUrl}") debe usar HTTPS en producción.`,
    );
  }
};
