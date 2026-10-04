# 002 · Autenticación — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar `../../constitution/tech-stack.md`._

## Enfoque

Full-page redirect a `/api/auth/login` (proxy de Vite en dev), sesión como server-state en TanStack Query (`GET /api/auth/session`) espejada en un slice de Zustand para que código no-React (el interceptor 401 de `apiClient`) pueda leer/limpiar la sesión sin pasar por hooks. Guards de ruta (`ProtectedRoute`/`PublicRoute`) y de UI (`RoleGuard`/`PermissionGuard`) construidos sobre ese slice.

## Implementación

1. **`vite.config.ts`** — `server.port: 5173` fijo (`strictPort: true`) + `server.proxy['/api'] = { target: 'http://localhost:3000', changeOrigin: true }`, para que `/api/*` llamado desde el navegador sea mismo origen.
2. **`.env.development`** (nuevo, committeable — no es secreto) — `VITE_API_BASE_URL=/api` (relativo, para que Axios pegue al proxy).
3. **`.env.production`** (nuevo, committeable) — `VITE_API_BASE_URL=http://localhost:3000/api` con comentario explícito de que hay que reemplazarlo por la URL real del backend desplegado antes de un build de distribución real.
4. **`src/types/api/auth.ts`** — `SessionUser`, `RoleSummary`, `PermissionSummary`, tipando exactamente `GET /api/auth/session`.
5. **`src/services/api/endpoints/auth.ts`** — `getSession()`, `refreshSession()`, `logout()` (llamadas Axios reales); `buildLoginUrl()`/`redirectToLogin()` para la navegación completa (no es una llamada Axios).
6. **`src/store/sessionStore.ts`** — Zustand: `{ user: SessionUser | null, status: 'idle'|'authenticated'|'unauthenticated', setSession(user), clearSession() }`.
7. **`src/services/api/apiClient.ts`** — el interceptor de respuesta, al mapear un `AuthenticationError` (401), llama `useSessionStore.getState().clearSession()` imperativamente (sin depender de React).
8. **`src/features/auth/hooks/useSession.ts`** — `useQuery(['auth','session'], getSession)` que sincroniza el resultado con `sessionStore`; `useLogoutMutation()` que llama `logout()`, limpia `sessionStore` y la caché de TanStack Query (`queryClient.clear()`).
9. **`src/routes/ProtectedRoute.tsx`** / **`src/routes/PublicRoute.tsx`** — envuelven `<Route>`, leen `sessionStore`, redirigen según corresponda. Mientras la query de sesión está `pending` en el primer load, muestran un loader en vez de decidir prematuramente.
10. **`src/features/auth/components/RoleGuard.tsx`** / **`PermissionGuard.tsx`** — reciben `role`/`permission` (o arrays) y `children`; renderizan solo si el `SessionUser` los tiene. (Corregido de `components/auth/` a `features/auth/components/` durante la implementación: son presentación específica del dominio auth, no un componente genérico — tech-stack.md §2.)
11. **`src/features/auth/pages/LoginPage.tsx`** — botón "Iniciar sesión" (`AppButton`, `isLoading` mientras navega), lee `?error=auth` de la query string y muestra un mensaje si está presente.
12. **`src/pages/Home.tsx`** — deja de ser el placeholder de `001`; ahora es una página protegida real que muestra `SessionUser` (nombre, email, roles) y un botón de logout; usa `RoleGuard` para un elemento de ejemplo.
13. **`src/routes/AppRoutes.tsx`** — `/login` envuelta en `PublicRoute`, `/home` envuelta en `ProtectedRoute`.
14. **Ajuste local en `canchago/.env`** (no versionado, no es código): `OAUTH_SUCCESS_REDIRECT_URL=http://localhost:5173/home`, `OAUTH_ERROR_REDIRECT_URL=http://localhost:5173/login?error=auth`. Requiere reiniciar `yarn dev` del backend para tomar efecto. Documentado aquí para que quede trazable, aunque no vive en este repo.
15. **`../../constitution/api-integration.md`** — no requiere contrato nuevo (ya estaba documentado), se agrega una nota de "confirmado con prueba real" con fecha.

## Decisiones

- **Proxy de Vite en vez de "Capacitor `server.url` apuntando al backend"** — la Decisión original de `tech-stack.md` §6 (heredada del Discovery) resultó **incompleta**: `server.url` solo sirve si algo sirve la SPA en ese mismo origen, y el backend no debe (ni puede, por constitución) servir el build de Ionic. El proxy de Vite sí logra mismo origen real en dev sin tocar el backend. `tech-stack.md` §6 se corrige en esta feature para reflejar esto.
- **Zustand además de TanStack Query para la sesión** — TanStack Query no es accesible desde módulos no-React (el interceptor de Axios). Zustand sí, y sirve exactamente para esto (tal como ya preveía `tech-stack.md` §5).
- **Login empaquetado nativo queda fuera de "hecho"** — no hay forma honesta de resolverlo sin (a) que el usuario apruebe la propuesta de `api-integration.md` §3, o (b) una alternativa equivalente. Se prefiere declarar la limitación explícitamente antes que fingir que "cap sync" implica que el login funciona en la app real.
- **`.env.development`/`.env.production` committeados, `.env` sigue gitignored** — no son secretos (son URLs base), y evita que cada desarrollador tenga que redescubrir el valor correcto para cada modo. Sigue la convención documentada de Vite.

## Riesgos

- **El ajuste local de `canchago/.env` se pierde si alguien resetea el repo backend** — mitigación: documentado en este plan con los valores exactos a restaurar; no es destructivo (el valor por defecto solo cambia la UX de aterrizaje, no rompe el login).
- **Alguien asume que "login funciona" implica que funciona en la app empaquetada** — mitigación: `spec.md` lo excluye explícitamente de los criterios de aceptación y del roadmap.
- **El usuario de prueba (`futbolista`) no tiene permisos, solo rol** — mitigación: el caso de `PermissionGuard` sin permisos concedidos se prueba explícitamente (oculta el elemento), no se asume que siempre habrá permisos.

## Bug real encontrado y corregido durante la validación

`useLogoutMutation` originalmente llamaba `queryClient.clear()` tras el logout. En la prueba end-to-end real (Chrome headless vía Playwright) el logout llamaba correctamente a `POST /api/auth/logout` (204) pero la UI se quedaba en `/home` — `ProtectedRoute` nunca redirigía. Causa: `clear()` vacía la caché pero no fuerza un refetch de las queries **activas** (montadas); el `useSession()` de `ProtectedRoute` se quedaba con `isPending`/datos viejos indefinidamente. Corregido reemplazando por `queryClient.removeQueries({ predicate: ... })` (limpia todo lo que no sea `auth`) + `queryClient.resetQueries({ queryKey: SESSION_QUERY_KEY })` (sí refetch-ea las queries activas). Verificado de nuevo con Playwright tras el fix — logout redirige correctamente. Esto es exactamente el tipo de defecto que un `curl` de un solo tiro no detecta — solo apareció al probar la interacción real de React con un navegador real.
