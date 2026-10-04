> Estado vigente (2026-10-01): la app nativa consume pasitos-backend (Next.js + Prisma + PostgreSQL), con autenticación local Bearer y sesiones persistentes. Las decisiones sobre Canchago/Keycloak de este documento son antecedentes históricos. Para endpoints y persistencia prevalece el contrato actualizado de api-integration.md.

# Tech Stack — canchago-ionic

_Tecnologías, convenciones y límites duros del frontend. Igual que en `canchago/spec/constitution/tech-stack.md`: si algo aquí choca con tu conocimiento general de Ionic/React/Capacitor, **este documento gana**._

---

## 1. Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Runtime | Node.js ≥ 22 | igual que el backend |
| App framework | Ionic React 8 | componentes Ionic + navegación nativa |
| UI library | React 19 + TypeScript estricto | sin `any`; versión resuelta por la plantilla oficial de Ionic al instalar (2026-08-14) |
| Empaquetado nativo | Capacitor 8 (iOS/Android) | ver §7 sobre limitación de despliegue inicial |
| Bundler/dev server | Vite (plantilla oficial `@ionic/react`) | |
| Router | React Router 5 vía `IonReactRouter` | `@ionic/react-router` 8 depende de react-router-dom v5, no v6 — decisión heredada de Ionic, no propia |
| Server state / caché | TanStack Query 5 | ver §5 |
| Estado global de cliente | Zustand | solo para estado realmente transversal (sesión, tema, conectividad) |
| Formularios | React Hook Form 7 | |
| Validación | Zod 4 | mismo major que el backend, mismo idioma de errores (español) |
| Cliente HTTP | Axios (instancia única) | ver §4 |
| Almacenamiento seguro | `@capacitor/preferences` (no sensible) + storage cifrado nativo para tokens (ver §6) | nunca `localStorage` para sesión |
| Logging | Wrapper propio ligero (no Pino) | mismos niveles y filosofía de redacción que el backend, ver §10 |
| Tests unitarios/hooks/servicios | Vitest + Testing Library | mismo runner que el backend (`vitest`) |
| Tests E2E | Cypress (contra el build web de Ionic) | flujos críticos: login, listar, crear, editar, eliminar, logout |
| Lint/Format | ESLint (`@ionic/eslint-config` + reglas React/TS) + Prettier | |
| Paquetes | Yarn (Berry, `nodeLinker: node-modules`) | ver Decisión D-1 más abajo |

**No existe backend propio en este proyecto. No existe lógica de negocio aquí — solo UI, orquestación de estado y consumo de contratos.** No agregues dependencias sin necesidad comprobada (§24 del prompt maestro).

### Decisión D-1 — Yarn (confirmado 2026-08-14, revierte la elección inicial de npm)

`ionic start` generó el scaffold inicial con npm por defecto (documentación oficial de Capacitor asume npm). El usuario pidió explícitamente unificar con Yarn, el mismo gestor que usa `canchago` (backend), para trabajar cómodo en ambos repos. Se migró: se borró `package-lock.json`, se agregó `.yarnrc.yml` con `nodeLinker: node-modules` (mismo criterio que el backend) y se generó `yarn.lock`.

**Gotcha real encontrado al migrar:** bajo Yarn, `@types/react-router` resolvió su propia copia anidada de `@types/react` (una versión distinta a la raíz), lo que rompió la compilación de JSX en `AppRoutes.tsx` con errores de tipos "Route cannot be used as a JSX component" (dos definiciones incompatibles de `ReactNode`). Se corrigió fijando `resolutions.@types/react` en `package.json` al mismo valor exacto que la versión raíz. Si en el futuro aparecen errores de JSX similares tras instalar una dependencia nueva, sospechar primero de una versión de `@types/react` duplicada en `node_modules/**/node_modules/@types/react` antes de asumir un bug de código.

### Decisión D-2 — Zustand en vez de Redux

Estado global mínimo (sesión resuelta, tema, estado de conectividad). Redux Toolkit sería sobreingeniería para este volumen de estado transversal; TanStack Query ya cubre todo el estado de servidor. Alternativa descartada: Redux Toolkit, Context API puro (demasiado boilerplate para selectors/perf en listas).

### Decisión D-4 — React Router 5 en vez de 6

`@ionic/react-router` 8.5.0 (la versión estable vigente al hacer `ionic start`) depende de `react-router-dom@^5.3.4`, no de v6. No es una elección de este proyecto sino una restricción de la integración oficial de Ionic; se documenta aquí para que nadie intente migrar a v6 sin antes confirmar que Ionic lo soporta.

### Decisión D-3 — Logger propio en vez de Pino

Pino está optimizado para Node/servidor (streams, transports); en un WebView/navegador aporta poco y añade peso al bundle. Se implementa un wrapper mínimo (`services/telemetry/logger.ts`) con los mismos niveles (`debug/info/warn/error`) y la misma disciplina de redacción que pide el backend, para mantener vocabulario y expectativas consistentes entre equipos.

---

## 2. Capas y responsabilidades

Flujo de una pantalla, estrictamente unidireccional:

```
Usuario → Página (routes/pages) → Hook de feature (hooks/) → Servicio (services/) → apiClient (Axios) → canchago API
                                        ↓
                                  TanStack Query (caché) / Zustand (estado transversal)
```

| Capa | Hace | No hace |
|---|---|---|
| `pages/` | Composición de layout, orquesta hooks de feature, maneja navegación | Llamadas HTTP directas, lógica de negocio, validación de payload |
| `features/<dominio>/components/` | Presentación específica del dominio | Acceso a red directo |
| `features/<dominio>/hooks/` | `useQuery`/`useMutation` de TanStack Query, mapea errores a UI | Contener reglas de negocio del backend |
| `services/api/` | Cliente Axios único, interceptores, mapeo de endpoints, tipos de request/response | Conocer componentes React ni JSX |
| `services/auth/` | Orquesta el flujo OAuth (ver §6), gestión de sesión | Lógica de permisos de negocio — solo refleja lo que el backend concede |
| `services/storage/` | Wrapper sobre Preferences/Secure Storage | Guardar tokens en texto plano ni en `localStorage` |
| `services/telemetry/` | Logging y trazabilidad (correlación de requests) | Enviar PII sin redactar |
| `validation/` | Schemas Zod para formularios (mejoran UX, nunca sustituyen al backend) | Lógica de negocio |
| `store/` | Slices Zustand de estado transversal | Cachear datos de servidor (eso es de TanStack Query) |
| `components/` | Componentes genéricos reutilizables (AppInput, AppButton, …) | Conocer un dominio específico |

Viola estas fronteras y el PR se rechaza — misma regla que el backend (AGENTS.md §4).

---

## 3. Estructura de carpetas

```
src/
├── app/                    ← shell de la app, providers globales (QueryClientProvider, ThemeProvider, Router)
├── assets/
├── components/
│   ├── common/              ← AppButton, AppInput, AppCard, AppAvatar, …
│   ├── feedback/             ← AppToast, AppAlert, AppLoader, AppSkeleton, AppEmptyState, AppErrorState
│   ├── forms/                ← AppSelect, AppDatePicker, AppSearchInput, wrappers de React Hook Form
│   └── layout/                ← AppHeader, AppPage, tab bar
├── config/                  ← lectura de variables de entorno (único punto de acceso, igual que el backend)
├── features/
│   ├── auth/                  ← login, callback, sesión, guards
│   ├── users/
│   ├── organizations/
│   ├── roles/
│   └── ...
├── hooks/                    ← hooks transversales (useNetworkStatus, useDebounce, …)
├── layouts/
├── pages/                    ← rutas de nivel superior, componen features
├── routes/                   ← definición de rutas + guards
├── services/
│   ├── api/                    ← apiClient, interceptors, endpoints, errorMapper, requestTypes, responseTypes
│   ├── auth/
│   ├── storage/
│   └── telemetry/
├── store/                    ← slices Zustand
├── types/
│   └── api/                    ← contratos TS espejo del backend, uno por módulo (users.ts, roles.ts, …)
├── utils/
├── validation/                ← schemas Zod por dominio
└── main.tsx
```

Nombrado: `camelCase` (vars/fns) · `PascalCase` (componentes/tipos) · `UPPER_SNAKE_CASE` (constantes globales) · `kebab-case.tsx` (archivos) · `kebab-case/` (directorios) — mismas reglas que el backend (AGENTS.md §5).

---

## 4. Capa API (`services/api/`)

Una única instancia Axios (`apiClient.ts`), `baseURL` desde `config/env.ts` (nunca `process.env` disperso). Responsabilidades centralizadas:

- **Interceptor de request**: adjunta `X-Correlation-ID` generado por request (ver §9), nunca adjunta manualmente cookies (son `HttpOnly`, el navegador/WebView las gestiona).
- **Interceptor de response**: mapea `{error: {code, message, details}}` del backend a las clases de error de §8; para colecciones, normaliza las dos formas de envelope reales del backend (`{data, meta}` estándar, y las excepciones documentadas `{organizations, meta}` / `{venues, meta}` — ver `api-integration.md`).
- **Timeout y reintentos**: timeout explícito; reintento solo para errores de red/timeout en operaciones idempotentes (GET), nunca en POST/PATCH/DELETE.
- **Cancelación**: `AbortController` por request, cancelado automáticamente cuando el componente se desmonta (vía TanStack Query).
- **401 global**: dispara el flujo de sesión expirada (limpia estado de auth, redirige a login) sin reintentar indefinidamente.

`services/api/endpoints/<modulo>.ts` — una función por endpoint real, firmada con los tipos de `types/api/<modulo>.ts`. Prohibido `fetch`/Axios disperso en componentes o hooks.

---

## 5. Server state (TanStack Query)

- Una `queryKey` por recurso + parámetros (`['users', {page, search}]`), invalidación explícita tras mutaciones.
- `staleTime`/`gcTime` por dominio, no un valor global mágico.
- Paginación e infinite scroll vía `useInfiniteQuery` solo donde el backend soporta cursor/página (todos los listados del backend usan `page`/`pageSize`).
- El estado de servidor **nunca** se copia a Zustand. Zustand es solo para: sesión resuelta (`SessionUser` cacheado tras `/api/auth/session`), tema, estado de red.

---

## 6. Autenticación — estrategia y limitación conocida

El backend implementa dos mecanismos según el cliente: el cliente **web** (`canchago-api`) usa exclusivamente OAuth 2.0 Authorization Code + PKCE con cliente confidencial y cookie `HttpOnly` — límite duro, sin excepción. El cliente **móvil** (`canchago-mobile`) usa Resource Owner Password Credentials (ROPC) — decisión de producto explícita del usuario (ver `api-integration.md` §3 "Revisión" para el detalle completo de esa conversación), no el default de la industria, y no aplica al cliente web.

**Estrategia real, validada en la feature `002-autenticacion` (corrige lo escrito originalmente aquí durante el Discovery — ver ese post-mortem abajo):**

- **En desarrollo (`yarn dev`, navegador) — validado end-to-end con el backend real:** `vite.config.ts` define un proxy (`server.proxy['/api'] → http://localhost:3000`) que hace que `/api/*` parezca mismo origen desde el navegador (`http://localhost:5173`). `VITE_API_BASE_URL=/api` (relativo, `.env.development`) para que Axios pegue al proxy, no directo al backend. Así el flujo OAuth completo (login → Keycloak → callback → cookie `HttpOnly` → `GET /api/auth/session` autenticado → logout) funciona sin tocar código del backend — solo se ajustó localmente (no versionado) `OAUTH_SUCCESS_REDIRECT_URL`/`OAUTH_ERROR_REDIRECT_URL` en `canchago/.env` para aterrizar de vuelta en la SPA.
- **Empaquetado nativo (Android/iOS vía Capacitor) — implementado en la feature `003-autenticacion-nativa`:** la idea original de este documento ("Capacitor `server.url` apuntando al backend") **no funcionaba** — `server.url` haría que el WebView cargue las páginas del *backend*, no la SPA. Se implementó primero con Authorization Code + navegador in-app (validada parcialmente), y luego se **reemplazó** por pedido explícito del usuario: un formulario nativo de usuario/contraseña (`LoginPage.tsx` → `NativeLoginForm`, React Hook Form + Zod + `AppInput`) que llama a `POST /api/auth/mobile/login` y recibe `Authorization: Bearer <sessionToken>` en vez de cookie. El token se guarda en `@aparajita/capacitor-secure-storage`. `apiClient` adjunta el Bearer solo cuando `Capacitor.isNativePlatform()`, y usa `withCredentials: false` en ese contexto (incompatible con el CORS abierto que el backend necesitó agregar — ver `api-integration.md` §3 para los 6 gaps de infraestructura reales encontrados al validar contra un emulador Android real).
- `services/api/endpoints/auth.ts` implementa `redirectToLogin()`/`getSession()`/`refreshSession()`/`logout()` (flujo web) y `loginWithPassword()` (flujo nativo) — mismo archivo, dos rutas de credencial, mismo backend.

### Post-mortem: por qué la estrategia original ("Capacitor `server.url`") estaba mal

Al escribir este documento durante el Discovery inicial, se asumió que apuntar `server.url` de Capacitor al dominio del backend lograría "mismo origen" para toda la app. Eso es incorrecto: `server.url` hace que el WebView cargue *contenido servido por esa URL*, y el backend no sirve (ni debe servir, por su propia constitución) el build de Ionic — solo serviría sus propias páginas/API. Same-origin real solo se logró en desarrollo gracias al proxy de Vite, que es una herramienta exclusiva del dev server, sin equivalente en un build empaquetado. Queda como lección: una estrategia de arquitectura que "no se ha probado contra el sistema real" debe marcarse como propuesta, no como decisión — este documento ahora sí refleja lo que fue realmente validado.

`ProtectedRoute`, `PublicRoute`, `RoleGuard`, `PermissionGuard` se implementan sobre el `SessionUser` devuelto por `/api/auth/session` (`roles[]`, `permissions[]`) — nunca se infieren permisos localmente sin ese origen.

---

## 7. Almacenamiento seguro

- Nunca `localStorage`/`sessionStorage` para sesión, tokens o datos sensibles.
- En web/dev, la sesión vive en la cookie `HttpOnly` — fuera del alcance de JS por diseño, no hay nada que almacenar del lado del cliente.
- En nativo, el `sessionToken` de `Authorization: Bearer` (feature `003-autenticacion-nativa`) se guarda con **`@aparajita/capacitor-secure-storage`** (Keychain en iOS, Keystore-backed EncryptedSharedPreferences en Android) vía `services/storage/secureToken.ts` — es el único lugar del proyecto que toca ese plugin. Elegido y confirmado compatible con Capacitor 8 antes de instalar.
- `@capacitor/preferences` solo para preferencias no sensibles (tema, idioma) — nunca para tokens.
- Limpiar todo estado sensible (Zustand + caché de TanStack Query + `secureToken`) al hacer logout.

---

## 8. Manejo de errores

Taxonomía obligatoria en `services/api/errorMapper.ts`, mapeada desde `{error.code}` del backend:

| Código backend | Clase frontend | Trato en UI |
|---|---|---|
| `VALIDATION_ERROR` | `ValidationError` | errores por campo bajo cada input |
| `UNAUTHORIZED` | `AuthenticationError` | fuerza flujo de login |
| `FORBIDDEN` | `AuthorizationError` | mensaje "no autorizado", oculta acción |
| `NOT_FOUND` | `NotFoundError` | empty/error state |
| `CONFLICT` | `BusinessRuleError` | mensaje contextual (p. ej. email duplicado) |
| `INTERNAL_ERROR` / sin código | `ServerError` | mensaje genérico, log técnico |
| timeout/red | `NetworkError` / `TimeoutError` | retry sugerido, estado offline |

Nunca mostrar al usuario stack traces, mensajes de Prisma ni el `message` crudo si es técnico — el backend ya envía mensajes en español pensados para usuario final; se muestran tal cual solo cuando `error.code` es de negocio/validación.

---

## 9. Trazabilidad

- Generar `X-Correlation-ID` (uuid) por request saliente en el interceptor de Axios.
- El backend actual **no** devuelve `X-Request-ID`/`traceparent` (confirmado leyendo `middleware/` y handlers — no hay tal header hoy). Se documenta como propuesta en `api-integration.md`; mientras tanto, el `X-Correlation-ID` generado en cliente es el único identificador de correlación disponible y se adjunta a cada entrada de log.
- Cada operación relevante logueada con: usuario (id, nunca email completo sin redactar), módulo, acción, endpoint, código HTTP, duración, `correlationId`.

---

## 10. Logging

`services/telemetry/logger.ts` con niveles `debug/info/warn/error`. Nunca loguear: cookies, tokens, contraseñas, payloads completos de formularios sensibles. Redacción de email (`p***@dominio.com`) y de cualquier identificación personal antes de loguear. `console.log` directo prohibido fuera de este módulo.

---

## 11. Seguridad — reglas no negociables

- Nunca Implicit Flow ni Resource Owner Password — el backend ya lo prohíbe (`directAccessGrantsEnabled: false`), el frontend no debe intentar rodearlo.
- Nunca leer o intentar leer la cookie `HttpOnly` desde JS.
- Autorización basada en permisos (`users.read`, etc. — verificar el código exacto vigente, ver bug documentado en `api-integration.md`), no solo en roles.
- No registrar tokens, cookies ni contraseñas en logs ni en crash reporting.
- No exponer errores técnicos del backend al usuario final.
- No construir filtros/orderBy dinámicos sin lista blanca — replicar exactamente los valores que cada endpoint acepta (`orderBy: 'name'|'email'|'createdAt'`, etc.), nunca aceptar un string arbitrario del usuario para ordenar.
- Todo valor embebido en el bundle de la app es público — nunca secretos de cliente OAuth confidencial (el `client_secret` vive solo en el backend, el frontend nunca lo necesita ni debe recibirlo).

---

## 12. Límites duros — lo que nunca se hace

- No reimplementar reglas de negocio del backend en el frontend "para ir más rápido".
- No inventar campos, endpoints o shapes de respuesta que no se hayan verificado leyendo `canchago` directamente.
- No modificar el repositorio `canchago` sin instrucción explícita del usuario.
- No usar `localStorage`/`sessionStorage` para sesión o tokens.
- No hacer `fetch`/Axios disperso fuera de `services/api/`.
- No mezclar yarn con npm/pnpm en este proyecto.
- No usar `any`, `as any` ni `// @ts-ignore` sin justificación documentada.
- No crear pantallas de listado sin paginación si el endpoint la soporta.
- No crear formularios sin validación Zod, aunque el backend ya valide.
- No asumir un envelope `{data, meta}` uniforme sin revisar `api-integration.md` (hay excepciones reales documentadas).
- No implementar optimistic update en operaciones críticas sin analizar el riesgo primero.

---

## 13. Comandos clave

_El navegador (`yarn dev`) es solo un atajo de desarrollo para iterar UI rápido — la app **no se distribuye como web/PWA**. El objetivo real y la única forma válida de "probar que funciona" es el WebView nativo: Android Studio (emulador/dispositivo) y Xcode (simulador/dispositivo)._

```bash
# Setup inicial
yarn install && yarn dev

# Antes de integrar cualquier cambio
yarn lint && yarn typecheck && yarn test && yarn build

# Sincronizar los proyectos nativos tras un cambio en src/
yarn cap:sync

# Android — build + abrir en Android Studio / build + correr en emulador o dispositivo conectado
yarn android
yarn android:run

# iOS — build + abrir en Xcode / build + correr en simulador o dispositivo conectado
yarn ios
yarn ios:run
```

---

## 14. Tests

- Unitarios junto al archivo: `services/auth/auth.service.test.ts`.
- Componentes críticos (inputs, formularios, guards) con Testing Library.
- Integración: `hook → servicio → API mock (msw) → estado UI`.
- E2E (Cypress) para flujos críticos: login, listar, crear, editar, eliminar, logout — mismos flujos que exige el backend en su AGENTS.md §13, ahora desde la perspectiva del cliente.
