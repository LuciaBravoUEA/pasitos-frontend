# Plan — 013 · Calidad, observabilidad y lanzamiento

## 1. Herramientas nuevas

- `@vitest/coverage-v8` (dev) — motor de cobertura, mismo major que `vitest@0.34`.
- `@sentry/capacitor` + `@sentry/react@10.69.0` (versión exacta exigida por el peer-check de `@sentry/capacitor@4.4.0`) — monitoreo de fallos con capa gratuita, funciona en web y en WebView nativo.
- Sin backend propio de monitoreo: se usa el free tier de Sentry (5k eventos/mes), DSN opcional vía `VITE_SENTRY_DSN` — sin DSN, `initMonitoring()` es un no-op.

## 2. `services/telemetry/monitoring.ts` (nuevo)

Wrapper mínimo sobre Sentry, con la misma disciplina de redacción que `logger.ts` (reutiliza `redactContext`, ahora exportado). `beforeSend` elimina `Authorization`/`Cookie`/`Set-Cookie` de cualquier header y el email/username del usuario si llegaran a colarse. `setMonitoringUser(id)` recibe siempre `SessionUser.id` (nunca `email`), invocado desde `store/sessionStore.ts` en `setSession`/`clearSession` — único lugar donde cambia la identidad de sesión en toda la app.

`apiClient.ts` llama a `captureMonitoringError` justo donde ya llamaba a `logger.error`, con el mismo objeto ya redactado (código, status, url, method) — nunca el error crudo de Axios, que podría llevar headers.

## 3. Cobertura

`vite.config.ts` agrega `test.coverage` (`provider: 'v8'`, reporters `text`+`html`), excluyendo tests, config y entrypoints sin lógica. Script `yarn test:coverage`. El reporte generado (`docs/evidence/coverage-report.md`) se lee como mapa de huecos, no como umbral a exigir — no se configuró `thresholds` para no convertir la cobertura en una meta de vanidad.

## 4. Pruebas nuevas (todas aditivas — ningún archivo de prueba existente se modificó, salvo el propio `CreateRoutinePage.tsx` para corregir el bug encontrado)

- `errorMapper.branches.test.ts` — cierra las ramas de `buildFromBackendCode` que la cobertura reveló sin recorrer (FORBIDDEN/NOT_FOUND/CONFLICT/INTERNAL_ERROR/METHOD_NOT_ALLOWED/default).
- `apiClient.contract.test.ts` — doble de transporte para 200/422/timeout (200 y 401+renovación ya estaban cubiertos en `apiClient.refresh.test.ts`).
- `RoutineListPage.test.tsx` — los cuatro estados de la pantalla principal de rutinas, con `routinesRepository` mockeado como origen de datos falso.
- `CreateRoutinePage.validation.test.tsx` — bloqueo de envío inválido, asociación de error de servidor a campo, y la prueba que reprodujo el bug de un campo no mapeado.
- `monitoring.test.ts` — no-op sin DSN, redacción de headers/PII, uso de id interno.

## 5. Bug encontrado y corregido (prueba primero, corrección después)

`CreateRoutinePage.tsx.onSubmit`: cuando el backend devuelve un `ValidationError` cuyo(s) `details[].field` no está en `FIELD_NAMES` (`title`/`description`/`category`/`points`), o cuando no hay `details` en absoluto, el formulario no mostraba ningún error — ni de campo ni general. El usuario se quedaba sin retroalimentación tras un envío fallido. Corregido: si ningún detalle mapea a un campo conocido, se cae al mensaje general (`setSaveError`) igual que cualquier otro error no-`ValidationError`.

## 6. CI

`.github/workflows/ci.yml`: `actions/setup-node@v4` (Node 22, cache Yarn) → `yarn install --immutable` → `lint` → `typecheck` → `test:coverage` → `build`, en cada push y pull request a cualquier rama.

## 7. Pendientes fuera del alcance de un agente de código

- Perfilado de rendimiento en modo de perfilado sobre un dispositivo físico (Android Studio Profiler / Xcode Instruments), identificación de hilo UI vs. trazado, corrección de un problema de fluidez real y remedición — requiere hardware físico. Guía dejada en `docs/evidence/performance-profiling-checklist.md`.
- Disparar un fallo real contra un proyecto de Sentry con DSN real y confirmar traza+versión en el panel — requiere cuenta real. Procedimiento en `docs/evidence/pre-release-checklist.md`.

## 8. Retirado a pedido explícito del usuario

- La única prueba E2E se implementó y luego se retiró (`cypress/e2e/routine-creation-flow.cy.ts` ya no existe) — el usuario pidió no agregarla salvo que el profesor la exija explícitamente en la rúbrica. `auth-flow.cy.ts` (ya existente antes de esta feature) sigue intacto.

## 8. Verificación

`yarn lint && yarn typecheck && yarn test:coverage` (ver `docs/evidence/coverage-report.md` para el resultado íntegro).
