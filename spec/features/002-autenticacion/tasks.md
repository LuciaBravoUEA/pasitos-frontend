# 002 · Autenticación — Tareas

- [x] `vite.config.ts`: puerto fijo 5173 + proxy `/api` → `http://localhost:3000`.
- [x] `.env.development` con `VITE_API_BASE_URL=/api`.
- [x] `.env.production` con `VITE_API_BASE_URL` absoluto + comentario de reemplazo obligatorio.
- [x] `src/types/api/auth.ts` (`SessionUser`, `RoleSummary`, `PermissionSummary`).
- [x] `src/services/api/endpoints/auth.ts` (`getSession`, `refreshSession`, `logout`, `buildLoginUrl`).
- [x] `src/store/sessionStore.ts` (Zustand).
- [x] Actualizar `src/services/api/apiClient.ts`: 401 limpia `sessionStore`.
- [x] `src/features/auth/hooks/useSession.ts` (`useSession`, `useLogoutMutation`).
- [x] `src/routes/ProtectedRoute.tsx` y `src/routes/PublicRoute.tsx`.
- [x] `src/features/auth/components/RoleGuard.tsx` y `PermissionGuard.tsx` (corregido de `components/auth/` a `features/auth/components/` — es presentación específica del dominio auth, ver tech-stack.md §2).
- [x] `src/features/auth/pages/LoginPage.tsx` (botón + estado de error `?error=auth`).
- [x] Reescribir `src/pages/Home.tsx` como página protegida real (identidad + logout + uso real de `RoleGuard` y `PermissionGuard`).
- [x] Actualizar `src/routes/AppRoutes.tsx` (`/login` público, `/home` protegido).
- [x] Tests de humo: `sessionStore` (3), guards (3), `useSession` (1, con mock de `services/api/endpoints/auth`).

## Validación real (obligatoria antes de marcar la feature como hecha)

- [x] Backend real corriendo local (Postgres nativo ya en marcha + Docker Keycloak levantado + `yarn dev` en `canchago`).
- [x] Ajustado localmente `OAUTH_SUCCESS_REDIRECT_URL`/`OAUTH_ERROR_REDIRECT_URL` en `canchago/.env` (no versionado) y backend reiniciado.
- [x] `yarn dev` en `canchago-ionic`, login real contra Keycloak con el usuario semilla `futbolista`/`ExamplePassword123!` (Chrome headless real vía Playwright, no solo `curl`), confirmado que `/home` muestra datos reales (`Hola, Mateo Vera`, email, rol).
- [x] Confirmado que recargar la página mantiene la sesión.
- [x] Confirmado que logout limpia la sesión y redirige a `/login` (tras corregir el bug de `queryClient.clear()` → `resetQueries`).
- [x] Confirmado que un deep-link a `/home` sin sesión dispara el 401 y `ProtectedRoute` redirige a `/login` automáticamente — cubre el mismo camino que "borrar la cookie a mano".

## Contratos y tipos (obligatorio)

- [x] `src/types/api/auth.ts` refleja el contrato real (sin `any`).
- [x] `../../constitution/api-integration.md` actualizado con la nota de "confirmado con prueba real" y la corrección de la estrategia same-origin (§6 de `tech-stack.md`, que pasó de "Capacitor `server.url`" — no viable tal como estaba escrito — a "proxy de Vite en dev").

## Cierre

- [x] Validado contra los criterios de aceptación de `spec.md` (incluyendo qué queda explícitamente fuera de alcance).
- [x] `yarn lint && yarn typecheck && yarn test && yarn build && yarn cap:sync` sin errores.
- [x] Movida a "Hecho" en `../../constitution/roadmap.md` **solo para el alcance de navegador/dev** — el empaquetado nativo queda explícitamente pendiente, no "hecho".
