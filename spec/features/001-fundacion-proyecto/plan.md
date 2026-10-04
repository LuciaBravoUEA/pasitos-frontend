# 001 · Fundación del proyecto — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar `../../constitution/tech-stack.md`._

## Enfoque

Partir de la plantilla oficial `@ionic/react` con Vite (vía `ionic start`), y sobre ella: reorganizar a la estructura de carpetas de la constitución, instalar y configurar el stack decidido (TanStack Query, Zustand, React Hook Form + Zod, Axios), y dejar los módulos de infraestructura (`services/api`, `services/telemetry`, `services/storage`) como esqueletos funcionales pero sin lógica de negocio ni pantallas reales. No se toca `canchago` en ningún paso.

## Implementación

1. `ionic start` (blank, React + Capacitor, `--package-id=ec.canchago.app`) — genera el proyecto base.
2. Reestructurar `src/` según `tech-stack.md` §3 (crear carpetas con `.gitkeep` donde aún no hay contenido: `features/`, `store/`, `types/api/`, `validation/`).
3. Configurar TypeScript estricto en `tsconfig.json` (`strict: true`, sin `any` implícito).
4. Configurar ESLint + Prettier, alineados con el estilo del backend (2 espacios, punto y coma, comillas simples).
5. `src/config/env.ts` — único punto de lectura de variables de entorno (`import.meta.env` de Vite), incluida `VITE_API_BASE_URL`.
6. `src/services/api/apiClient.ts` — instancia Axios única, `withCredentials: true` (necesario para la cookie de sesión, ver `tech-stack.md` §6), interceptores de request/response esqueleto (correlation ID, mapeo de error básico).
7. `src/services/api/errorMapper.ts` — taxonomía de errores de `tech-stack.md` §8, sin casos de uso reales todavía.
8. `src/services/telemetry/logger.ts` — wrapper de logging con niveles y redacción básica.
9. `src/services/storage/` — wrapper sobre `@capacitor/preferences`, esqueleto para storage seguro de sesión (sin implementar aún el mecanismo cifrado nativo — se decide en `002-autenticacion`).
10. `src/app/` — `QueryClientProvider` (TanStack Query), router base (`IonReactRouter`), tema claro/oscuro (variables CSS de Ionic + `prefers-color-scheme`).
11. `src/components/common/` — 2-3 componentes base mínimos (`AppButton`, `AppPage`) para validar que el sistema de diseño arranca; el resto del catálogo se construye bajo demanda en features posteriores.
12. Configurar Vitest + Testing Library; un test trivial de humo por módulo de infraestructura.
13. Verificar `npx cap sync` sin errores.
14. **Migrar de npm a Yarn** (Berry, `nodeLinker: node-modules`): borrar `package-lock.json`, agregar `.yarnrc.yml` igual al del backend, `yarn set version 3.6.4`, `yarn install`. Fijar `resolutions.@types/react` para evitar una copia anidada distinta resuelta por `@types/react-router` (rompía la compilación de JSX — ver `tech-stack.md` D-1).
15. Corregir `appName`/`ionic.config.json` (quedaron con el nombre temporal `canchago-ionic-scaffold` usado para generar el proyecto en un directorio temporal).
16. `npx cap add android` y `npx cap add ios` — agregar las plataformas nativas.
17. Scripts en `package.json`: `cap:sync`, `android`/`android:run`/`android:open`, `ios`/`ios:run`/`ios:open` (build web + sync + abrir/correr).
18. Validar que ambas plataformas compilan de verdad en headless: `./gradlew assembleDebug` (Android) y `xcodebuild ... -sdk iphonesimulator build` (iOS) — no solo que `cap add`/`cap sync` no fallen.

## Decisiones

- **Vite + plantilla oficial `@ionic/react`** — evita reinventar configuración de bundler; es el camino soportado oficialmente por Capacitor.
- **No generar todo el catálogo de componentes de una vez** — evita sobreingeniería; se construyen cuando una feature real los necesita.
- **`withCredentials: true` desde el día 1 en el cliente Axios** — aunque el login real llega en `002`, dejar el cliente ya preparado para cookies evita retrabajo.
- **Yarn en vez de npm** (revierte D-1 original) — pedido explícito del usuario para unificar con el backend. Ver `tech-stack.md` D-1 para el detalle y el gotcha de `@types/react` que produjo.
- **App exclusivamente nativa, nunca web/PWA** — pedido explícito del usuario; `yarn dev` queda solo como atajo de desarrollo, nunca como target de distribución.

## Riesgos

- **Confundir esta fundación con una feature funcional** — mitigación: los criterios de aceptación de `spec.md` prohíben explícitamente cualquier pantalla de negocio o login real.
- **Elegir versiones de dependencias que no coincidan con lo documentado en `tech-stack.md`** — mitigación: fijar versiones mayores exactas al instalar y actualizar la tabla de `tech-stack.md` si alguna no está disponible o cambia.
