import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { assertSecureProductionConfig } from './config/env';
import { initMonitoring } from './services/telemetry/monitoring';

// Falla rápido en vez de arrancar un build de producción con configuración insegura
// (HTTP sin excepción documentada) — ver spec/features/010-cliente-http-datos-chatbot/plan.md §5.
assertSecureProductionConfig();
// Sin VITE_SENTRY_DSN, esta llamada es un no-op (ver services/telemetry/monitoring.ts).
initMonitoring();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
