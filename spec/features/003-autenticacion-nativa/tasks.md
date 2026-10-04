# 003 · Autenticación nativa — Tareas

## Revisión: formulario nativo + ROPC (reemplaza la versión Authorization Code)

- [x] Eliminar `services/auth/pkce.ts`, `services/auth/nativeAuth.ts`, `features/auth/hooks/useNativeAuthListener.ts` (+ tests).
- [x] `yarn remove @capacitor/browser`.
- [x] Revertir intent-filter de `AndroidManifest.xml` y `CFBundleURLTypes` de `Info.plist`.
- [x] `src/config/env.ts`: eliminar variables OAuth sin uso.
- [x] `.env.development`/`.env.production`/`.env.example`/`.env`: quitar variables OAuth.
- [x] `src/validation/auth.ts`: `loginFormSchema` (Zod).
- [x] `src/components/forms/AppInput.tsx`: primer componente de formulario real.
- [x] `src/services/api/endpoints/auth.ts`: `loginWithPassword` reemplaza `exchangeMobileCode`.
- [x] `src/features/auth/pages/LoginPage.tsx`: reescrito con `NativeLoginForm` (RHF + Zod + `AppInput` + `IonInputPasswordToggle`) y `WebLogin`.
- [x] `src/app/App.tsx`: quitar `useNativeAuthListener`.

## Gaps de infraestructura descubiertos y corregidos (ver spec.md para el detalle)

- [x] `capacitor.config.ts`: `server.androidScheme: 'http'` (Mixed Content).
- [x] `Info.plist`: `NSAppTransportSecurity.NSAllowsArbitraryLoads` (ATS).
- [x] `AndroidManifest.xml`: `android:usesCleartextTraffic="true"`.
- [x] `canchago/proxy.ts` (nuevo, renombrado de `middleware.ts` por Next.js 16): CORS abierto en `/api/*`, incluye `X-Correlation-ID` en `Access-Control-Allow-Headers`.
- [x] `src/services/api/apiClient.ts`: `withCredentials: !Capacitor.isNativePlatform()`.

## Tests

- [x] `src/validation/auth.test.ts` (3 tests).
- [x] Suite completa sigue en verde tras la limpieza (19 tests, 8 archivos).

## Validación real (obligatoria antes de marcar la feature como hecha)

- [x] `./gradlew assembleDebug` → `BUILD SUCCESSFUL` tras cada cambio de manifiesto.
- [x] `xcodebuild ... -sdk iphonesimulator` → `BUILD SUCCEEDED`.
- [x] Emulador Android real (`Medium_Phone_API_36.0`), APK instalado, interacción real vía Chrome DevTools Protocol contra el WebView de la app instalada.
- [x] Login real (`futbolista`/`ExamplePassword123!`) → `/home` con datos reales del usuario.
- [x] Logout real → vuelve a `/login`.
- [x] Persistencia real: `force-stop` + relanzar la app → entra directo a `/home` sin pedir login de nuevo.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build && yarn cap:sync` sin errores.

## Cierre

- [x] Validado contra los criterios de aceptación de `spec.md`.
- [x] Roadmap actualizado con la revisión completa.

## Corrección de persistencia 2026-09-20

- [x] Corregir login y sesiones persistentes del backend local.
- [x] Guardar arranque independiente del IDE y documentarlo.
- [x] Verificar autenticación, reinicio, revocación y checks: cuenta temporal propia, reinicio real, expiración y revocación; cliente lint/typecheck/77 tests/build; backend TypeScript y lint de autenticación.
