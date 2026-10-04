# 003 · Autenticación nativa (Android/iOS empaquetados)

**Estado:** implementado ✅

## Revisión 2026-08-14 — de Authorization Code + navegador in-app a formulario nativo

Esta feature se implementó primero con Authorization Code + PKCE + navegador in-app (Custom Tabs/SFSafariViewController) — validada parcialmente (deep link, apertura del navegador, URL de autorización correcta). El usuario, al verla, pidió explícitamente reemplazarla: quiere un formulario propio de usuario/contraseña dentro de la app, sin abrir ninguna pantalla externa — estilo Facebook. Eso implica Resource Owner Password Credentials (ROPC) del lado del backend, que es lo que `canchago/AGENTS.md` prohíbe por defecto; se le explicó el riesgo (contraseña expuesta al código de la app, sin MFA/social login fácil a futuro) y lo confirmó explícitamente, solo para el cliente móvil (ver `canchago/spec/features/014-autenticacion-movil-nativa/spec.md`, sección "Revisión", para el detalle completo del lado del backend).

Se eliminó todo el código de la versión anterior: `services/auth/pkce.ts`, `services/auth/nativeAuth.ts`, `features/auth/hooks/useNativeAuthListener.ts`, la dependencia `@capacitor/browser`, y el registro del esquema `ec.canchago.app://` en `AndroidManifest.xml`/`Info.plist`. Este documento describe la versión implementada: formulario nativo + ROPC.

## Qué hace

Muestra un formulario nativo de usuario/contraseña (`AppInput` + React Hook Form + Zod) cuando la app corre empaquetada (`Capacitor.isNativePlatform()`), que llama a `POST /api/auth/mobile/login` del backend (feature `014`, revisión ROPC) y recibe un `sessionToken` opaco que se guarda en almacenamiento seguro nativo. En navegador/dev (`yarn dev`) se sigue usando el flujo de la feature `002` (cookie + proxy de Vite + redirect a Keycloak) sin ningún cambio — las dos rutas conviven en el mismo `LoginPage.tsx`, elegidas en tiempo de ejecución.

## Contrato de API consumido

Verificado contra el backend real (`canchago`, feature `014`, revisión ROPC) el 2026-08-14 — ver `../../constitution/api-integration.md` §3:

- `POST /api/auth/mobile/login` — sin auth previa. Body: `{ username, password }`. Responde `{ data: { sessionToken, expiresAt } }` o `401` con mensaje genérico si las credenciales son incorrectas.
- Todo lo demás (`/api/auth/session`, `/api/auth/refresh`, `/api/auth/logout`) es exactamente lo mismo que `002`, autenticado con `Authorization: Bearer <sessionToken>` en vez de cookie.

## Cómo funciona, en orden

1. El usuario escribe usuario/contraseña en el formulario nativo (`NativeLoginForm` dentro de `LoginPage.tsx`).
2. Al enviar, `loginWithPassword(username, password)` llama a `POST /auth/mobile/login` vía `apiClient` — sin navegador externo, sin redirección.
3. El `sessionToken` recibido se guarda en `@aparajita/capacitor-secure-storage` (Keychain en iOS, Keystore-backed EncryptedSharedPreferences en Android) — **nunca** `@capacitor/preferences`, que no es seguro.
4. Se invalida la query de sesión (`queryClient.invalidateQueries`) para que `useSession()` refetch-ee y los guards reaccionen — mismo mecanismo que `002`.
5. `apiClient` adjunta `Authorization: Bearer <sessionToken>` automáticamente en toda llamada **solo cuando `Capacitor.isNativePlatform()` es verdadero**, leyendo el token de storage seguro en cada request.
6. El resto de la app (guards, `useSession`, `Home`) no sabe ni le importa si la sesión vino de cookie o de Bearer — mismo código de `002`.

## Gaps de infraestructura reales encontrados y corregidos durante la validación

Ninguno de estos era evidente por adelantado — todos aparecieron al probar contra el emulador real, no contra mocks:

1. **Mixed Content (Android):** el WebView servía la app en `https://localhost` por defecto, y el navegador bloquea toda llamada HTTP desde una página HTTPS. Corregido con `server.androidScheme: 'http'` en `capacitor.config.ts`.
2. **App Transport Security (iOS):** equivalente iOS del punto anterior — bloquea HTTP por defecto. Corregido con `NSAppTransportSecurity.NSAllowsArbitraryLoads` en `Info.plist` (ambos marcados explícitamente como ajuste de desarrollo local, a revisar cuando el backend real tenga HTTPS).
3. **`usesCleartextTraffic` (Android):** con `targetSdkVersion 36`, Android bloquea TODO tráfico HTTP a nivel de red para la app entera, independiente del punto 1 (ese era específico del WebView). Corregido con `android:usesCleartextTraffic="true"` en `AndroidManifest.xml`.
4. **Sin CORS en el backend:** una vez resueltos 1–3, las llamadas SÍ salían pero el navegador bloqueaba la lectura de la respuesta — el backend nunca había necesitado CORS (todo era same-origin o cookie same-site). Corregido en `canchago` con `proxy.ts` (Next.js 16 renombró `middleware.ts` a `proxy.ts` — otra sorpresa de esta versión) que agrega `Access-Control-Allow-Origin: *` a `/api/*`. Seguro porque el cliente móvil no usa cookies, solo Bearer — no hay credenciales que un origen ajeno pueda robar vía CORS abierto.
5. **`withCredentials: true` incompatible con CORS `*`:** `apiClient` seguía mandando `withCredentials: true` (heredado de la config web), y un navegador rechaza la combinación de origen `*` con modo credenciales — sin importar que no hubiera cookie real que enviar. Corregido: `withCredentials: !Capacitor.isNativePlatform()`.
6. **Header personalizado fuera de la lista de CORS:** el interceptor de `apiClient` agrega `X-Correlation-ID` a cada request (trazabilidad, `tech-stack.md` §9); el preflight de CORS lo rechazaba porque `Access-Control-Allow-Headers` no lo incluía. Corregido agregándolo en `canchago/proxy.ts`.

## Criterios de aceptación

- [x] `LoginPage` detecta plataforma nativa (`Capacitor.isNativePlatform()`) y muestra el formulario nativo; en navegador sigue usando `002` sin cambios.
- [x] El formulario usa React Hook Form + Zod (`src/validation/auth.ts`), con mensajes de error debajo de cada campo.
- [x] El flujo completo se validó de punta a punta en un **emulador Android real** (no un mock): formulario real → `POST /auth/mobile/login` real → Keycloak real → Postgres real → `sessionToken` real → navegación a `/home` mostrando el nombre/email reales del usuario.
- [x] El token se guarda con `@aparajita/capacitor-secure-storage`, nunca con `@capacitor/preferences` ni `localStorage`.
- [x] Logout limpia también el token del almacenamiento seguro nativo, no solo Zustand/TanStack Query — validado en el emulador (logout real → vuelve a `/login`).
- [x] La sesión persiste tras matar la app por completo y reabrirla (`adb shell am force-stop` + relanzar) — validado en el emulador: reabre directo en `/home` con los datos del usuario, sin pedir login de nuevo.
- [x] El flujo web/dev (`002`, cookie + proxy) sigue funcionando exactamente igual — no se tocó su código, solo el `LoginPage` bifurca por plataforma.
- [x] `yarn android`/`yarn ios` (build headless real, `gradlew assembleDebug` / `xcodebuild -sdk iphonesimulator`) compilan tras los cambios.

### Contratos y tipos (obligatorio)

- [x] `MobileTokenResponse` en `src/types/api/auth.ts` (sin `any`) — mismo shape que antes, solo cambió el endpoint/request que lo produce.
- [x] `../../constitution/api-integration.md` §3 actualizado con el contrato ROPC real y los 6 gaps de infraestructura encontrados.

## Fuera de alcance

- Cambiar o tocar la lógica de negocio de `canchago` más allá de lo ya hecho en su feature `014` — el CORS agregado en `proxy.ts` es infraestructura transversal, no lógica de dominio.
- MFA/social login para el cliente móvil — ROPC no lo soporta bien; ver `014` para el detalle.
- Certificate pinning / HTTPS real — pendiente hasta que exista un backend desplegado con dominio real (ver `.env.production`).
- Automatizar la escritura de credenciales en un teclado nativo real (esta validación se hizo disparando eventos DOM reales vía Chrome DevTools Protocol contra el WebView de la app instalada en el emulador — el formulario, el JS y el backend son 100% reales; lo único no ejercitado es literalmente el dedo tocando el teclado físico, que es UI del sistema operativo, no código de la app).

## Mantenimiento autorizado 2026-09-20

Corregir el backend local para conservar sesiones válidas tras reiniciar y arrancar fuera de la terminal del IDE. Se preservan los contratos de login y session. Logout revoca la sesión persistida y refresh devuelve 204 extendiendo el mismo token vigente. No se cambia la contraseña de ninguna cuenta desde el login.
