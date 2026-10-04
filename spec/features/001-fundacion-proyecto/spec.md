# 001 · Fundación del proyecto

**Estado:** implementado ✅

## Qué hace

Establece el esqueleto técnico de `canchago-ionic`: proyecto Ionic React + TypeScript + Capacitor inicializado, estructura de carpetas de `tech-stack.md` §3 creada, tooling de calidad configurado, tema base (claro/oscuro) aplicado, y la capa de infraestructura mínima (cliente API, manejo de errores, logging, storage, React Query, formularios) lista para que la primera feature funcional (autenticación) se construya encima. **No incluye ninguna pantalla de negocio ni el flujo de login real.**

### Actualización 2026-08-14 — alcance móvil-only + Yarn

El usuario aclaró dos decisiones que cambian el alcance original de esta feature:

1. **La app nunca se distribuye como web/PWA.** El navegador (`vite dev` / `yarn dev`) se usa únicamente como atajo de desarrollo para iterar UI rápido; el objetivo real y el único que cuenta para "funciona" es el WebView nativo vía Capacitor, probado en Android Studio (emulador/dispositivo) y Xcode (simulador/dispositivo) — ambos ya instalados por el usuario.
2. **Gestor de paquetes: Yarn, no npm.** Revierte la Decisión D-1 de `tech-stack.md` — unifica con el gestor que ya usa `canchago` (backend). Ver D-1 actualizada.

Esto amplía el alcance de esta feature (antes "Fuera de alcance") para incluir: agregar las plataformas nativas Android/iOS vía Capacitor y dejar scripts cómodos en `yarn` para compilarlas/abrirlas. Sigue sin incluir firma para stores ni publicación — eso permanece fuera de alcance.



## Por qué

Ninguna feature funcional puede empezar sin esta base: sin capa de API centralizada y tipos reales no hay forma de garantizar que las pantallas respeten el contrato de `canchago` (regla no negociable de `mission.md`). Hacerlo como feature propia, con su spec/plan/tasks, evita que la infraestructura se improvise pantalla por pantalla.

## Contrato de API consumido

Ninguno todavía — esta feature no llama a ningún endpoint real, solo deja lista la infraestructura para que la siguiente feature (`002-autenticacion`) lo haga contra los contratos ya documentados en `../../constitution/api-integration.md`.

## Criterios de aceptación

- [x] `yarn dev` levanta la app Ionic en el navegador sin errores (solo como atajo de desarrollo, no como target de distribución).
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` pasan sin errores sobre el scaffold inicial.
- [x] La estructura de carpetas de `../../constitution/tech-stack.md` §3 existe y está vacía/con placeholders donde aún no hay código.
- [x] Existe una instancia única de cliente Axios en `src/services/api/apiClient.ts` con `baseURL` leída desde `src/config/`, sin `process.env` disperso en el resto del código.
- [x] Existe el wrapper de logging (`src/services/telemetry/logger.ts`) con niveles `debug/info/warn/error` y redacción básica, y no hay ningún `console.log` fuera de él.
- [x] TypeScript en modo estricto (`strict: true`), sin `any` en el código propio del scaffold.
- [x] Tema claro/oscuro funcional (`@ionic/react/css/palettes/dark.system.css` sigue `prefers-color-scheme` sin JS, sin flash).
- [x] `yarn cap:sync` corre sin errores.
- [x] Plataformas nativas `android/` e `ios/` agregadas vía Capacitor y sincronizadas.
- [x] Scripts `yarn android:open` / `yarn ios:open` (Android Studio / Xcode) y `yarn android:run` / `yarn ios:run` (build + deploy a emulador/dispositivo) disponibles en `package.json`.

### Contratos y tipos (obligatorio)

- [x] No aplica en esta feature (no se consume ningún endpoint todavía) — se deja constancia explícita de que se revisó y no aplica, en vez de omitir la sección.

## Fuera de alcance

- Login real / flujo OAuth (feature `002-autenticacion`).
- Cualquier pantalla de negocio (usuarios, organizaciones, roles).
- Firma, provisioning profiles y publicación en stores (iOS/Android) — se deja el proyecto nativo compilable y abrible, no publicable.
- CI/CD.
