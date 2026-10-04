# Integración con la API — canchago-ionic ↔ canchago

_Contratos reales verificados leyendo el código de `canchago` (no la documentación OpenAPI cuando ambas discrepan — se anota explícitamente cuando eso pasa). Este documento se actualiza cada vez que una feature consume o descubre un contrato nuevo, y es el lugar donde se registran necesidades de cambio en el backend **antes** de pedir su implementación — nunca se modifica `canchago` directamente desde este proyecto._

Última verificación: 2026-08-14, contra el estado actual de `canchago` en `main`.

---

## 1. Base URL y prefijo

`{APP_BASE_URL}/api/...`. En desarrollo backend: `http://localhost:3000/api`. No hay versión de API en el path (sin `/v1`).

## 2. Autenticación — flujo real

Confidential OIDC client vía Keycloak (realm `canchago`, client `canchago-api`), Authorization Code + PKCE, `directAccessGrantsEnabled: false` (sin password grant), `implicitFlowEnabled: false`.

```
GET  /api/auth/login       → 302 a Keycloak (genera PKCE + nonce, cookie temporal canchago_oauth_state)
     (usuario autentica en la pantalla de Keycloak — no se puede pintar dentro de la app)
GET  /api/auth/callback    → intercambia code, crea/actualiza UserSession, setea cookie canchago_session, 302
GET  /api/auth/session     → auth requerido → { data: SessionUser }
POST /api/auth/refresh     → auth requerido → 204 (rota tokens si quedan <5min de vida)
POST /api/auth/logout      → auth requerido → 204 (revoca en Keycloak + marca revokedAt en UserSession)
```

`SessionUser = { id, sub?, email, name, roles: [{id, code, name}], permissions: [{id, code}] }`. El backend local conserva `sub` en el payload Bearer y expone también `id = sub` en `/api/auth/session` para cumplir el contrato del cliente.

**Cookies:**
- `canchago_session` — `HttpOnly; Secure; SameSite=Lax; Path=/`, 8h. Solo contiene `{sessionId, createdAt}` sellado con `@hapi/iron`; los tokens OAuth reales viven server-side en la tabla `user_sessions`.
- `canchago_oauth_state` — igual de flags, 10 min TTL, temporal durante el handshake.

**Consecuencia crítica para el frontend:** JS nunca puede leer estos cookies (`HttpOnly` por diseño) ni forwardearlos manualmente. La sesión solo funciona si las llamadas HTTP se hacen desde el mismo contexto de navegador/WebView que completó el login, con `withCredentials: true`, y **same-origin con el backend** (no hay CORS configurado — ver §5).

## 3. Auth para app empaquetada (Android/iOS): formulario nativo + Bearer token

**Estado: implementado ✅ (2026-08-14, feature `014` del backend + feature `003` de este repo, revisión ROPC).** El usuario aprobó explícitamente la propuesta original de esta sección (cliente público + Bearer) y luego pidió reemplazar el mecanismo de obtención del token: no un navegador externo con Keycloak, sino un formulario nativo de usuario/contraseña dentro de la app. Ver `canchago/spec/features/014-autenticacion-movil-nativa/spec.md` y `spec/features/003-autenticacion-nativa/spec.md` (secciones "Revisión") para el detalle completo de esa conversación y el riesgo aceptado explícitamente (Resource Owner Password Credentials).

**Contrato real:**

- **Cliente OAuth público en Keycloak**: `canchago-mobile` (`publicClient: true`, sin secreto). Es el **único** cliente del realm con `directAccessGrantsEnabled: true` — `canchago-api` (web) sigue exigiendo Authorization Code + PKCE sin excepción.
- **Endpoint**: `POST /api/auth/mobile/login` — body `{ username, password }`, responde `{ data: { sessionToken, expiresAt } }` o `401` con mensaje genérico en español (nunca el texto real de Keycloak) si las credenciales son incorrectas. `sessionToken` es el mismo payload sellado (`@hapi/iron`) que normalmente viaja en la cookie del flujo web.
- **`middleware/auth.ts` acepta `Authorization: Bearer <token>`** como alternativa a la cookie, resolviendo la misma tabla `user_sessions`. `/api/auth/session`, `/api/auth/refresh` y `/api/auth/logout` funcionan igual con Bearer que con cookie.
- **`canchago/proxy.ts` (nuevo)** — CORS abierto (`Access-Control-Allow-Origin: *`) en `/api/*`. Next.js 16 renombró el archivo de convención de `middleware.ts` a `proxy.ts`; usar el nombre viejo generaba un warning de deprecación pero igual funcionaba. Seguro sin restringir el origen porque el cliente móvil nunca usa cookies (`withCredentials: false` en ese contexto), solo Bearer — no hay credenciales de cookie que un origen ajeno pueda robar.

**Cómo lo usa el frontend** (feature `003`): `LoginPage.tsx` muestra un formulario nativo (`AppInput` + React Hook Form + Zod) cuando `Capacitor.isNativePlatform()` es verdadero, llama a `loginWithPassword()` (`POST /auth/mobile/login`), y guarda el `sessionToken` en `@aparajita/capacitor-secure-storage` (nunca `@capacitor/preferences`). El flujo web/dev de la feature `002` (cookie + proxy de Vite + redirect a Keycloak) sigue existiendo sin cambios en el mismo archivo, elegido en tiempo de ejecución.

### Gaps de infraestructura reales encontrados al validar contra un emulador Android real (no evidentes por adelantado)

1. **Mixed Content (Android)** — el WebView sirve la app en `https://localhost` por defecto; una página HTTPS no puede llamar a un backend HTTP. Fix: `capacitor.config.ts` → `server.androidScheme: 'http'`.
2. **App Transport Security (iOS)** — mismo problema, otro mecanismo. Fix: `Info.plist` → `NSAppTransportSecurity.NSAllowsArbitraryLoads`.
3. **`usesCleartextTraffic` (Android)** — con `targetSdkVersion 36`, Android bloquea *todo* tráfico HTTP a nivel de red para la app entera, más allá del WebView. Fix: `AndroidManifest.xml` → `android:usesCleartextTraffic="true"`.
4. **Backend sin CORS** — una vez resueltos 1–3, las llamadas salían pero el navegador bloqueaba leer la respuesta. Fix: `canchago/proxy.ts` (arriba).
5. **`withCredentials: true` incompatible con CORS `*`** — heredado de la config web; un navegador rechaza la combinación aunque no exista cookie real que enviar. Fix: `apiClient.ts` → `withCredentials: !Capacitor.isNativePlatform()`.
6. **Header `X-Correlation-ID` fuera de la lista de CORS** — el interceptor de trazabilidad lo agrega a cada request; el preflight lo rechazaba. Fix: incluido en `Access-Control-Allow-Headers` de `proxy.ts`.

Los seis se descubrieron probando de verdad contra un emulador Android + Keycloak + Postgres reales (interacción vía Chrome DevTools Protocol contra el WebView de la app instalada), no contra mocks — login real, identidad real en `/home`, logout real, y persistencia real de la sesión tras matar y reabrir la app.

## 4. Autorización

`middleware/access.ts` compara `req.user.permissions[].code` contra permisos requeridos por endpoint (ver §6 tabla de endpoints). El frontend refleja `SessionUser.permissions[]` para mostrar/ocultar UI, pero **nunca** decide autorización real — cada 403 del backend es la autoridad final.

⚠️ **Bug conocido en el backend (roadmap `010`, abierto a 2026-08-14):** el middleware exige códigos `users.read`/`users.create`/`users.manage`, pero el catálogo sembrado usa `usuarios.read`/`usuarios.write`/`usuarios.delete` — ningún permiso real satisface hoy al módulo de usuarios (`/api/users` responde 403 siempre). **No implementar la pantalla de gestión de usuarios como "funcional" hasta que este bug se resuelva en `canchago`** — construir la UI pero marcarla explícitamente como bloqueada por este defecto en `roadmap.md`.

## 5. Sin CORS

No hay `next.config.ts` con headers CORS ni `middleware.ts` raíz en `canchago`. Si se abandona la estrategia same-origin (§3), esto bloquea cualquier llamada cross-origin desde el WebView — requiere el cambio de backend listado en §3.

## 6. Endpoints disponibles hoy (identidad/RBAC — no hay dominio de reservas aún)

| Recurso | Rutas | Métodos + permiso | Notas |
|---|---|---|---|
| Auth | `/api/auth/{login,callback,session,refresh,logout}` | ver §2 | público excepto session/refresh/logout |
| Usuarios | `/api/users`, `/api/users/{userId}`, `/api/users/{userId}/roles`, `/api/users/{userId}/roles/{roleId}` | GET/POST/PATCH/DELETE, permisos `users.*` | ver bug §4; DELETE es soft (status→INACTIVE); lista NO incluye roles, detalle SÍ |
| Organizaciones | `/api/organizaciones`, `/api/organizaciones/{organizationId}` | GET/POST/PATCH/DELETE, `organizaciones.read`/`.manage` | **lista responde `{organizations, meta}`, NO `{data, meta}`** — el propio Swagger del backend lo documenta mal, no confiar en `GET /api/docs` para este endpoint |
| Sedes | `/api/organizaciones/{organizationId}/sedes`, `.../sedes/{sedeId}` | GET/POST/PATCH/DELETE, mismos permisos que organizaciones | **lista responde `{venues, meta}`, NO `{data, meta}`** — mismo bug de documentación |
| Roles | `/api/roles`, `/api/roles/{roleId}`, `/api/roles/{roleId}/permisos` | GET/POST/PATCH/DELETE, `roles.read`/`.manage` | requieren `?organizationId=<uuid>` como query, NO como parte del path — fácil de olvidar |
| Permisos | `/api/permisos` | GET, `permisos.read` | catálogo global, sin CRUD |
| Docs | `/api/docs`, `/api/docs/spec` | público | Swagger UI real, útil para explorar pero no 100% confiable (ver bugs de envelope arriba) |

**No existen** endpoints de canchas/recursos reservables ni reservas — ese dominio aún no está modelado en `canchago` (confirmado en `prisma/schema.prisma`). Cualquier feature de "buscar/reservar cancha" requiere trabajo previo de backend, fuera del alcance de este proyecto hasta que se construya allí.

## 7. Contrato de respuesta

```json
// Éxito individual
{ "data": { "...": "..." } }

// Colección (regla general)
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }

// EXCEPCIONES reales al patrón anterior — usar tal cual, no "corregir" en el mapeo:
{ "organizations": [], "meta": {...} }   // GET /api/organizaciones
{ "venues": [], "meta": {...} }          // GET /api/organizaciones/{id}/sedes

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field", "message", "type" }] } }
```

Códigos de error reales usados hoy: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500), `METHOD_NOT_ALLOWED` (405). `BUSINESS_RULE_ERROR` (422) y `TOO_MANY_REQUESTS` (429) están reservados en el backend pero **ningún endpoint los lanza todavía** — no construir UI para ellos como si existieran hoy.

## 8. Trazabilidad — estado real

El backend **no** devuelve `X-Request-ID`, `X-Correlation-ID` ni `traceparent` en ningún response (confirmado, no hay tal header en `middleware/` ni handlers). El `X-Correlation-ID` que el frontend genera (`tech-stack.md` §9) es local al cliente únicamente — no hay forma de correlacionarlo con logs del servidor hasta que el backend lo adopte. Propuesta pendiente de registrar formalmente si se vuelve necesario para soporte/diagnóstico.

## 9. Modelos relevantes hoy (identidad/RBAC)

`User` (+`UserProfile` 1:1, +`AuthAccount[]` para el vínculo OAuth, +`UserSession[]`), `Organization`, `Venue` (única por `[organizationId, name]`), `Role` (única por `[organizationId, name]`, `organizationId` nullable = rol global), `Permission` (`code` único, formato `<modulo>.<accion>`), `RolePermission`, `UserRole` (con `organizationId`/`venueId` opcionales — asignación con alcance). No hay `Cancha`/`Reserva` todavía.

## 10. Registro de cambios

_Cada vez que una feature nueva descubra o requiera un contrato distinto a lo aquí escrito, añadir una entrada fechada aquí antes de implementar._

- **2026-08-14** — Discovery inicial. Documento creado a partir de lectura directa de `canchago` (auth, middleware, `pages/api/`, `prisma/schema.prisma`, validaciones Zod, `.env.example`).
- **2026-08-14** — Feature `002-autenticacion`: contrato de auth (§2) **confirmado con prueba real** contra el backend corriendo local (Postgres nativo + Keycloak vía Docker + `yarn dev`), no solo leído. Flujo completo login → sesión → logout probado dos veces: primero con `curl` + cookie jar (usuario semilla `futbolista`/`ExamplePassword123!`), después con Chrome headless real (Playwright) ejecutando el código real de `canchago-ionic`. Se corrigió la estrategia de "mismo origen" documentada en `tech-stack.md` §6 — la idea original (`Capacitor server.url` apuntando al backend) no es viable tal como estaba escrita; ver el post-mortem en ese documento. La solución real para desarrollo es un proxy de Vite; para el empaquetado nativo, el gap de §3 de este documento sigue abierto y sin resolver.
- **2026-08-30** — Entorno local `pasitos-backend`: se agregó `POST /api/auth/mobile/register` para pruebas de desarrollo. Acepta `{ name, username, email, password }` y devuelve `{ data: { sessionToken, expiresAt } }`. Las cuentas se mantienen solo en memoria del contenedor y se pierden al reiniciarlo; no es un contrato de producción ni sustituye Keycloak.
- **2026-08-30** — Auditoría feature `009`: el repositorio local disponible `pasitos-backend` no contiene los endpoints históricos de organizaciones, sedes, usuarios, roles o permisos descritos en las secciones 6–9; solo implementa health y autenticación local. Por tanto esos contratos no son ejecutables en el entorno actual y no pueden respaldar evidencia de listado/detalle/creación. Para el nuevo trabajo académico se requiere aprobar un contrato real de rutinas en `pasitos-backend` o recuperar el backend `canchago`. No se implementó ningún endpoint ficticio en el cliente.
- **2026-09-19** — Feature `010`: se detectó que `POST /api/auth/refresh` responde `204` sin cuerpo — suficiente para el flujo cookie/web (la rotación queda en la cookie que gestiona el navegador), pero insuficiente para el flujo Bearer/nativo, que necesita recibir el token rotado para reemplazarlo en `secureToken.ts`. **Propuesta pendiente de aprobación** (no implementada en el backend): que `/api/auth/refresh` devuelva `{ data: { sessionToken, expiresAt } }` (mismo shape que `/auth/mobile/login`) cuando la petición llega con `Authorization: Bearer`, en vez de `204`. Mientras tanto, el interceptor de renovación del cliente (`apiClient.ts`) acepta ambas respuestas: si hay cuerpo, rota el token guardado; si es `204`, asume que la sesión sigue vigente y reintenta la petición original una sola vez.

## 11. Tabla de correspondencia servidor ↔ cliente (identidad + rutinas)

_Contrato real verificado en §2 y §9 de este documento, y en `prisma/schema.prisma` de `pasitos-backend`. Todos los campos opcionales del backend se modelan como anulables (`nullable()`/`?`) en el cliente — nunca se asume `undefined` donde el backend puede enviar `null` explícito._

| Campo servidor | Tipo servidor | Campo cliente (`types/api/*.ts`) | Anulable | Divergencia de nombre |
|---|---|---|---|---|
| `SessionUser.id` | `string` (uuid) | `SessionUser.id` | no | ninguna |
| `SessionUser.email` | `string` | `SessionUser.email` | no | ninguna |
| `SessionUser.name` | `string` | `SessionUser.name` | no | ninguna |
| `SessionUser.roles[]` | `{id, code, name}[]` | `SessionUser.roles: RoleSummary[]` | no | ninguna |
| `SessionUser.permissions[]` | `{id, code}[]` | `SessionUser.permissions: PermissionSummary[]` | no | ninguna |
| `rutina.id` | `string` (uuid) | `Routine.id` | no | ninguna |
| `rutina.userId` | `string` (uuid) | `Routine.userId` | no | ninguna |
| `rutina.title` | `string` | `Routine.title` | no | ninguna |
| `rutina.description` | `string \| null` | `Routine.description` | **sí** (`.nullable()`) | ninguna |
| `rutina.category` | enum string | `Routine.category: RoutineCategory` | no | ninguna |
| `rutina.points` | `number` | `Routine.points` | no | ninguna |
| `rutina.completed` | `boolean` | `Routine.completed` | no | ninguna |
| `rutina.createdAt` | `string` (ISO) | `Routine.createdAt` | no | ninguna |

**Nota:** hoy no existe ninguna divergencia real de nombre entre `pasitos-backend` y el cliente (ambos usan los mismos identificadores en inglés para el dominio de rutinas, a pesar de que las rutas HTTP están en español — `/api/rutinas`). Se documenta explícitamente en cada schema Zod (`types/api/routines.ts`, `types/api/auth.ts`) con un comentario `// divergencia:` junto a cada campo, incluso cuando dice "ninguna", para que quede evidenciado que se revisó campo por campo y no que se omitió la verificación.

# Actualización: registro móvil persistente

`POST /api/auth/mobile/register` persiste la cuenta en PostgreSQL. `username` y `email` se normalizan a minúsculas y son únicos. La contraseña se almacena exclusivamente como hash `scrypt` con sal aleatoria. Las cuentas creadas sobreviven al reinicio del backend y pueden autenticarse posteriormente mediante `POST /api/auth/mobile/login`.

Las operaciones `GET /api/rutinas`, `GET /api/rutinas/{routineId}` y `POST /api/rutinas` también persisten en PostgreSQL. El detalle se reconstruye mediante el UUID de la ruta y continúa disponible después de reiniciar el backend.

## 12. Seguimiento educativo — feature 012

El backend local añade tablas `tasks`, `student_guardians`, `student_teachers` y `task_completions` mediante la migración `prisma/migrations/012_student_tracking/migration.sql`.

| Recurso | Ruta | Autorización |
|---|---|---|
| Estudiantes asignados | `GET /api/estudiantes/asignados?date=YYYY-MM-DD` | Padre/tutor por `student_guardians`; docente por `student_teachers` |
| Progreso | `GET /api/estudiantes/{studentId}/progreso?date=YYYY-MM-DD` | Estudiante propio o relación autorizada |
| Cumplimiento | `POST /api/tareas/{taskId}/completar` | Solo el estudiante propietario de la rutina |

Los cumplimientos usan una restricción única `(studentId, taskId, activityDate)` y `upsert`; repetir la operación del mismo día no genera duplicados.
# Corrección verificada de autenticación local — 2026-09-20

Autorizada por el usuario para `pasitos-backend`. Login/registro conservan `{ data: { sessionToken, expiresAt } }`. Los nuevos tokens son opacos y aleatorios; solo su hash SHA-256 se guarda en `user_sessions`, usando la tabla existente. `GET /api/auth/session` consulta PostgreSQL y reconstruye la identidad actual. Las sesiones sobreviven al reinicio durante su vigencia de 24 horas; los tokens anteriores en memoria requieren un nuevo login.

`POST /api/auth/logout` existe ahora en el backend local y responde 204 tras revocar la sesión. `POST /api/auth/refresh` responde 204 y extiende el mismo token aún vigente; responde 401 si falta, expiró o fue revocado. La propuesta histórica de rotación con respuesta JSON no se implementa: conservar el token hace compatible este 204 con el cliente nativo actual.

Validación real con una cuenta temporal propia: registro, login, misma sesión y mismas credenciales después de reiniciar Docker, refresh, logout y rechazo de tokens revocados, vencidos e inventados. Cuenta temporal eliminada. Los errores 500 históricos quedaron confirmados en logs, pero su excepción original no estaba registrada; ahora se registra nombre/código del error sin credenciales ni tokens.
