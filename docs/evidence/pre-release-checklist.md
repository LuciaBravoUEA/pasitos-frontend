# Lista de verificación previa a la publicación

Cada punto deja constancia del resultado obtenido en esta sesión (2026-09-26). Los marcados **pendiente (usuario)** requieren una acción que un agente de código no puede completar (cuenta real de Sentry, dispositivo físico, push a un remoto).

| Punto | Resultado |
| --- | --- |
| Inventario de riesgos jerarquizado con decisión escrita | Hecho — `docs/evidence/risk-inventory.md` |
| Pruebas unitarias sobre lógica de decisión (validadores, traducción de errores, conversiones) | Hecho — `errorMapper.test.ts` + `errorMapper.branches.test.ts`, `validation/routines.test.ts`, `validation/auth.test.ts` |
| Pruebas unitarias corren sin conexión, sin emulador, en cualquier orden | Hecho — Vitest + `jsdom`, `fake-indexeddb` para IndexedDB; `yarn test` no requiere red ni dispositivo; Vitest no impone orden entre archivos (ejecuta en paralelo por defecto) |
| Pruebas de componente para los 4 estados de la pantalla principal | Hecho — `RoutineListPage.test.tsx` (cargando/datos/vacía/error) |
| El formulario impide envío inválido y asocia errores de servidor a campos | Hecho — `CreateRoutinePage.validation.test.tsx` |
| Doble del transporte HTTP: 200, 401 con renovación, 422, timeout | Hecho — `apiClient.contract.test.ts` + `apiClient.refresh.test.ts` |
| Repositorio de la Semana 13 como origen de datos falso en pruebas de pantalla | Hecho — `routinesRepository` mockeado en `RoutineListPage.test.tsx` y `CreateRoutinePage.test.tsx` |
| Una sola prueba E2E sobre el recorrido crítico | **Retirada a pedido del usuario (2026-09-26)** — se agrega solo si el profesor la exige explícitamente en la rúbrica |
| Regresión visual solo en componentes reutilizables del sistema de diseño | Decisión: no se introduce en esta ronda (ver `risk-inventory.md`, sección "Medio") — no hay herramienta de snapshots visuales instalada; agregarla sin necesidad comprobada sería sobre-ingeniería |
| Cobertura ejecutada y leída como mapa | Hecho — `docs/evidence/coverage-report.md` |
| Prueba agregada para una rama que la cobertura reveló sin recorrer | Hecho — `errorMapper.branches.test.ts` |
| Un bug reproducido primero con una prueba y corregido después | Hecho — `CreateRoutinePage.tsx` (campo de error de servidor no mapeado se perdía en silencio) |
| Ninguna prueba desactivada | Hecho — verificado (`grep` de `.skip`/`xit`/`xdescribe` en todo `src/`: sin coincidencias) |
| Rendimiento medido en modo de perfilado sobre dispositivo físico | **Pendiente (usuario)** — guía en `docs/evidence/performance-profiling-checklist.md` |
| Identificar hilo UI vs. trazado antes de corregir | **Pendiente (usuario)** — mismo documento, sección 3 |
| Corregir un problema de fluidez y remedir | **Pendiente (usuario)** — mismo documento, sección 4 |
| Registro estructurado con niveles en vez de `console.*` disperso | Ya existente — `services/telemetry/logger.ts` (único punto autorizado a llamar `console.*`) |
| El registro no incluye tokens, contraseñas ni datos personales | Hecho — `logger.test.ts` (ya existente) + revisión de `redactContext` |
| Monitoreo de fallos con capa gratuita instrumentado | Hecho — `services/telemetry/monitoring.ts` (Sentry, sin DSN = no-op) |
| Encabezado de autorización y datos personales filtrados del monitoreo | Hecho — `monitoring.test.ts` (`beforeSend` redacta headers y email) |
| Identificador interno en vez de correo/documento | Hecho — `setMonitoringUser(user.id)` en `sessionStore.ts` |
| Provocar un fallo real y confirmar traza+versión en el panel de monitoreo | **Pendiente (usuario)** — necesita `VITE_SENTRY_DSN` real; procedimiento abajo |
| Integración continua en cada cambio enviado | Hecho — `.github/workflows/ci.yml` (lint + typecheck + test:coverage + build en push/PR) |

## Procedimiento para "provocar un fallo de prueba" contra Sentry real (pendiente, usuario)

1. Crear un proyecto gratuito en sentry.io (o self-hosted) para "React"/"Capacitor".
2. Copiar el DSN a `.env.production` (o `.env.development` para probar local) como `VITE_SENTRY_DSN=...` y fijar `VITE_APP_VERSION` a la versión real que se va a publicar.
3. Ejecutar `yarn build && yarn preview` (o `yarn dev`), y en algún punto de la app forzar un error real, por ejemplo desde la consola del navegador: `throw new Error('prueba de monitoreo')`, o provocando un 500 real del backend.
4. Confirmar en el panel de Sentry que el evento llegó con: stack trace legible, `release` igual a `VITE_APP_VERSION`, y **sin** el header `Authorization` ni el email de la persona usuaria en el payload (revisar la pestaña "Request"/"User" del evento).
