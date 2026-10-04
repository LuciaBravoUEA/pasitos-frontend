# 001 · Fundación del proyecto — Tareas

- [x] Inicializar proyecto Ionic React + TypeScript + Capacitor con Vite.
- [x] Reestructurar `src/` según `../../constitution/tech-stack.md` §3.
- [x] Configurar TypeScript estricto (`strict: true`, sin `any` implícito).
- [x] Configurar ESLint + Prettier alineados al estilo del backend.
- [x] Crear `src/config/env.ts` como único punto de acceso a variables de entorno.
- [x] Crear `src/services/api/apiClient.ts` (Axios único, `withCredentials: true`, interceptores esqueleto).
- [x] Crear `src/services/api/errorMapper.ts` con la taxonomía de `tech-stack.md` §8.
- [x] Crear `src/services/telemetry/logger.ts` con niveles y redacción básica.
- [x] Crear `src/services/storage/` esqueleto sobre `@capacitor/preferences`.
- [x] Configurar `QueryClientProvider`, router (`IonReactRouter`) y tema claro/oscuro en `src/app/`.
- [x] Crear componentes base mínimos (`AppButton`, `AppPage`) en `src/components/common/`.
- [x] Configurar Vitest + Testing Library, con un test de humo por módulo de infraestructura.
- [x] Verificar `npx cap sync` sin errores.
- [x] Migrar el proyecto de npm a Yarn (Berry, `nodeLinker: node-modules`, igual que el backend).
- [x] Fijar `resolutions.@types/react` (gotcha de tipos duplicados vía `@types/react-router` bajo Yarn).
- [x] Corregir `appName` (`capacitor.config.ts`) e `ionic.config.json` (quedó el nombre temporal del scaffold).
- [x] Agregar plataforma nativa Android (`cap add android`).
- [x] Agregar plataforma nativa iOS (`cap add ios`).
- [x] Scripts `yarn android`/`android:run`/`android:open` y `yarn ios`/`ios:run`/`ios:open`.
- [x] Validar build headless real de Android (`./gradlew assembleDebug` → `BUILD SUCCESSFUL`, APK generado).
- [x] Validar build headless real de iOS (`xcodebuild ... -sdk iphonesimulator` → `BUILD SUCCEEDED`).
- [x] Excluir `.yarn/`, `android/`, `ios/` del lint (binarios vendorizados / proyectos nativos generados).

## Contratos y tipos (obligatorio)

- [x] No aplica en esta feature — se deja constancia de la revisión, sin endpoints reales consumidos todavía.

## Cierre

- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [x] Mover la feature 001 a "Hecho" en `../../constitution/roadmap.md` y promover `002-autenticacion` a "Siguiente".
