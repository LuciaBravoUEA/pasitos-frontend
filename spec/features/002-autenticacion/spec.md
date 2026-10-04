# 002 · Autenticación

**Estado:** implementado ✅ (alcance navegador/dev — ver "Fuera de alcance" para lo que sigue pendiente)

## Qué hace

Permite a un usuario iniciar sesión contra el backend real de `canchago` (Keycloak, OAuth2 Authorization Code + PKCE), mantener la sesión activa entre recargas, ver su identidad y permisos reales, y cerrar sesión. Introduce las rutas protegidas/públicas de la app: sin sesión válida no se puede ver `/home`; con sesión válida no se puede volver a `/login`.

## Por qué

Es la primera feature funcional real del proyecto — hasta ahora (`001`) no existía ninguna llamada al backend. Sin sesión no hay forma de que ninguna otra feature (usuarios, organizaciones, roles) tenga sentido, porque todas requieren un usuario autenticado con permisos.

## Contrato de API consumido

Verificado contra el backend real corriendo en local (Keycloak + Postgres + Next.js) el 2026-08-14 — ver `../../constitution/api-integration.md` §2 para el detalle completo. Resumen:

- `GET /api/auth/login` — sin auth. Redirect 302 a Keycloak (no es una llamada `fetch`, es una navegación de página completa).
- `GET /api/auth/callback` — sin auth (lo maneja el backend solo). Redirect 302 a `OAUTH_SUCCESS_REDIRECT_URL` / `OAUTH_ERROR_REDIRECT_URL`.
- `GET /api/auth/session` — auth requerida. `{ data: SessionUser }` donde `SessionUser = { id, email, name, roles: [{id,code,name}], permissions: [{id,code}] }`.
- `POST /api/auth/refresh` — auth requerida. `204`, rota tokens si quedan <5min de vida.
- `POST /api/auth/logout` — auth requerida. `204`, revoca la sesión en el servidor.

**Validación real ejecutada** (no solo leída): se completó el flujo completo con `curl` + cookie jar contra el backend local (Keycloak con el usuario semilla `futbolista`/`ExamplePassword123!`), confirmando `canchago_session` seteada y `GET /api/auth/session` devolviendo `{"data":{"id":"...","email":"futbolista@canchago.local","name":"Mateo Vera","roles":[{"code":"futbolista",...}],"permissions":[]}}`. El usuario `futbolista` no tiene permisos asignados hoy — solo el rol — así que las pantallas que dependan de `permissions[]` deben tratarlo como caso real, no hipotético.

## Decisión arquitectónica: cómo se logra "mismo origen" (obligatorio para que la cookie `HttpOnly` funcione)

El backend no tiene CORS ni soporta Bearer token (ver `api-integration.md` §3). La única forma de que el navegador/WebView envíe y reciba la cookie `canchago_session` sin tocar el backend es que **todas las llamadas de la SPA compartan origen con la cookie**. Esta feature lo resuelve así:

- **En desarrollo (`yarn dev`, navegador):** proxy de Vite (`vite.config.ts` → `server.proxy['/api']`) reenvía `/api/*` al backend real (`http://localhost:3000`). Desde el navegador, todo parece mismo origen (`http://localhost:5173`) — sin CORS, sin problema de `SameSite`. **Esto quedó validado end-to-end en esta feature.**
- **Empaquetado nativo (Android/iOS vía Capacitor):** **sigue sin resolverse** — no hay proxy equivalente al de Vite dentro de un WebView empaquetado. Point pendiente de la decisión que el usuario todavía no ha tomado (`api-integration.md` §3: same-origin real vs. propuesta de auth nativa con cambios en `canchago`). Esta feature **no** declara "hecho" el login dentro de la app empaquetada — ver Fuera de alcance.
- **Ajuste local (no versionado) en `canchago`:** se cambió `OAUTH_SUCCESS_REDIRECT_URL` y `OAUTH_ERROR_REDIRECT_URL` en el `.env` local (gitignored, no es código, no se commitea) para que apunten de vuelta al dev server del frontend (`http://localhost:5173/home` y `http://localhost:5173/login?error=auth`) en lugar del valor por defecto (`http://localhost:3000/api/auth/session`, que mostraba JSON crudo). Sin este cambio el login igual funciona (la cookie se setea igual), solo que el usuario aterriza en una página JSON en vez de en la SPA. Documentado en `plan.md`.

## Criterios de aceptación

- [x] `LoginPage` navega de página completa a `/api/auth/login` (vía el proxy de Vite) al presionar "Iniciar sesión".
- [x] Tras un login real contra Keycloak, la app aterriza autenticada en `/home` mostrando el nombre, email y roles reales del usuario (`GET /api/auth/session`).
- [x] Al recargar la página estando autenticado, la sesión persiste (no hay que volver a loguear).
- [x] `ProtectedRoute` redirige a `/login` si no hay sesión válida (probado con deep-link directo a `/home` sin cookie).
- [x] `PublicRoute` (usada en `/login`) redirige a `/home` si ya hay sesión válida.
- [x] Botón de logout llama `POST /api/auth/logout`, limpia la sesión local (Zustand + caché de TanStack Query) y redirige a `/login`. (Bug real encontrado y corregido durante la prueba: `queryClient.clear()` no refetch-ea queries activas; se cambió a `resetQueries` — ver `plan.md`.)
- [x] Un 401 en cualquier llamada de `apiClient` limpia la sesión local automáticamente (sin esperar a que el usuario navegue).
- [x] `?error=auth` en `/login` (llegada desde `OAUTH_ERROR_REDIRECT_URL`) muestra un mensaje de error claro, no técnico.
- [x] `RoleGuard`/`PermissionGuard` existen y tienen al menos un uso real — probado con el usuario real `futbolista` (tiene rol pero CERO permisos): el bloque `RoleGuard role="administrador"` y el bloque `PermissionGuard permission="users.read"` quedan ambos correctamente ocultos.
- [x] Validado con el backend real corriendo localmente (Keycloak + Postgres) usando Chrome headless real (Playwright + `channel: 'chrome'`), no solo con mocks ni con `curl`.

### Contratos y tipos (obligatorio)

- [x] `src/types/api/auth.ts` define `SessionUser`, `RoleSummary`, `PermissionSummary` reflejando exactamente el contrato real (sin `any`).
- [x] `../../constitution/api-integration.md` ya documentaba este contrato desde el Discovery inicial — no requirió cambios, solo quedó confirmado con la prueba real (entrada añadida en §10 "Registro de cambios").

## Fuera de alcance

- **Login funcional dentro de la app empaquetada (Android/iOS vía Capacitor)** — bloqueado por la decisión arquitectónica pendiente (`api-integration.md` §3). Se implementa el mismo código (no hay dos implementaciones), pero no se valida ni se declara "hecho" en ese contexto todavía.
- Refresh silencioso automático programado (solo refresh manual disparado por la app o reintento tras 401).
- Recuperación de contraseña, registro de usuario nuevo, cambio de contraseña — eso lo gestiona Keycloak directamente, fuera del alcance de esta app.
- Pantallas de usuarios/organizaciones/roles — features `003`, `004`, `005`.
