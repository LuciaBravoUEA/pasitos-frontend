# 003 · Autenticación nativa — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar `../../constitution/tech-stack.md`._

## Enfoque (revisado — ver "Revisión" en spec.md)

Formulario nativo simple (React Hook Form + Zod, mismo patrón que se usará para cualquier otro formulario futuro de la app) que llama a un único endpoint (`POST /auth/mobile/login`). Todo el código de sesión de `002` (guards, `useSession`, `sessionStore`, `Home`) se reutiliza sin cambios — la única diferencia real es cómo se obtiene el `sessionToken` inicial y cómo se adjunta (`Authorization: Bearer`, ya construido en `001`/`002` para la rama nativa del interceptor).

## Implementación

1. **Dependencias**: `@aparajita/capacitor-secure-storage` (ya instalado, sigue usándose). Se **desinstaló** `@capacitor/browser` (ya no hace falta sin navegador in-app).
2. **`src/config/env.ts`** — vuelve a su forma mínima de `002`: solo `apiBaseUrl`/`apiTimeoutMs`. Se eliminaron `oauthAuthorizationUrl`/`oauthMobileClientId`/`oauthMobileRedirectUri`/`oauthScope` — el frontend ya no habla con Keycloak directamente, solo con `canchago`.
3. **`src/validation/auth.ts`** — `loginFormSchema` (Zod): `username`/`password`, ambos `min(1)`.
4. **`src/components/forms/AppInput.tsx`** — primer componente de formulario real del catálogo (`tech-stack.md` §3 ya lo preveía). Envuelve `IonInput` con `label`, `labelPlacement="stacked"`, `fill="outline"`, `errorText` — mensaje de error debajo del campo, tal como pide el prompt maestro.
5. **`src/services/api/endpoints/auth.ts`** — `exchangeMobileCode` (Authorization Code) reemplazado por `loginWithPassword(username, password)` (`POST /auth/mobile/login`).
6. **`src/features/auth/pages/LoginPage.tsx`** — reescrito: `NativeLoginForm` (React Hook Form + `Controller` + `AppInput`, con `IonInputPasswordToggle` para el campo de contraseña) vs. `WebLogin` (el botón de siempre de `002`), elegidos por `Capacitor.isNativePlatform()`.
7. **`src/app/App.tsx`** — se quita `useNativeAuthListener` (ya no hay deep link que escuchar).
8. **Manifiestos nativos** — se revierte el intent-filter de `AndroidManifest.xml` y el `CFBundleURLTypes` de `Info.plist` (sin uso). Se **mantienen** los fixes de `capacitor.config.ts` (`androidScheme: 'http'`) y `Info.plist` (`NSAppTransportSecurity`) — siguen siendo necesarios para que la app hable con el backend por HTTP en desarrollo, independiente del mecanismo de login.
9. **`AndroidManifest.xml`** — se agrega `android:usesCleartextTraffic="true"` (gap nuevo encontrado en esta revisión, ver spec.md).
10. **`canchago/proxy.ts`** (repo backend) — CORS abierto para `/api/*`, incluyendo `X-Correlation-ID` en `Access-Control-Allow-Headers` (gaps nuevos encontrados en esta revisión).
11. **`src/services/api/apiClient.ts`** — `withCredentials: !Capacitor.isNativePlatform()` (gap nuevo: CORS `*` es incompatible con `withCredentials: true`).

## Decisiones

- **Formulario propio en vez de WebView/navegador embebiendo Keycloak** — decisión de producto explícita del usuario, confirmada entendiendo el trade-off de seguridad (ver `014`).
- **CORS abierto (`*`) en el backend, sin restringir a un origen específico** — seguro porque el cliente móvil nunca usa cookies (`withCredentials: false` ahí), solo `Authorization: Bearer`; no hay credenciales de cookie que un origen ajeno pueda robar vía CORS. El flujo web (`002`) no pasa por CORS en absoluto (same-origin vía proxy de Vite), así que esto no afecta su seguridad.
- **`usesCleartextTraffic`/`NSAppTransportSecurity`/`androidScheme` documentados explícitamente como ajustes de desarrollo local** — los tres apuntan a lo mismo: hoy el backend de pruebas es HTTP plano; en cuanto exista un backend real con HTTPS, estos tres se pueden (y deben) revisar/acotar.

## Validación

_A diferencia de la versión anterior de esta feature (que no pudo completar un login interactivo real dentro de la sesión de trabajo), esta sí se validó de punta a punta contra un emulador Android real:_

1. **Build nativo real**: `./gradlew assembleDebug` (`BUILD SUCCESSFUL`) tras cada cambio de manifiesto/config.
2. **Emulador real**: `Medium_Phone_API_36.0` (AVD), APK instalado vía `adb install`.
3. **Interacción real vía Chrome DevTools Protocol**: conectado al WebView de la app instalada (`adb forward` al socket `webview_devtools_remote_*`), se dispararon eventos DOM reales (`ionInput`, click) sobre los campos y el botón — no una simulación aparte, es el mismo HTML/JS que ve un usuario real, corriendo dentro de la app real.
4. **Resultado**: login con `futbolista`/`ExamplePassword123!` real → `POST /auth/mobile/login` real (confirmado en el log del backend) → navegación a `/home` mostrando `"Hola, Mateo Vera"` y el email real → logout real → vuelve a `/login` → relanzar la app tras `force-stop` → entra directo a `/home` sin pedir login (persistencia del token en `@aparajita/capacitor-secure-storage` confirmada).
5. Los 6 gaps de infraestructura documentados en `spec.md` se descubrieron y corrigieron exactamente así — probando contra el sistema real, no contra mocks, tal como exige el proceso de este proyecto.

**No se automatizó**: escribir las credenciales tecleando en el teclado físico/virtual del emulador (eso es interacción de UI del sistema operativo). Se llenaron los campos disparando los mismos eventos DOM que el teclado dispararía, contra el mismo formulario real.

## Corrección de persistencia 2026-09-20

1. Eliminar el reseteo implícito de la cuenta semilla durante login.
2. Persistir hash de tokens opacos en la tabla existente user_sessions y reconstruir identidad desde users.
3. Implementar logout/refresh usados por el cliente; mantener token al renovar para compatibilidad 204.
4. Arranque Docker desacoplado, restart unless-stopped y regeneración de Prisma.
5. Verificar reinicio con cuentas de prueba propias y ejecutar checks.
