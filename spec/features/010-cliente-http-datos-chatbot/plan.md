# Plan técnico — 010

## 1. `services/api/apiClient.ts`

- `validateStatus: status => status >= 200 && status < 300` explícito (documenta que 4xx/5xx se tratan como error interpretable vía el interceptor de respuesta, no como "network error").
- Un único interceptor de **request**: correlación (`X-Correlation-ID`) + inyección de Bearer (nativo, leído de `secureToken.ts`) + log de request en dev con `Authorization` redactado. Se combinan en una sola función a propósito — Axios ejecuta los interceptors de request en orden **LIFO**, lo que es ambiguo si se registran por separado; con una sola función el orden interno es el que dicta el código, no el registro.
- Dos interceptors de **response**, registrados en este orden (Axios los ejecuta en orden **FIFO**, por eso el orden de `.use()` sí importa aquí):
  1. **Logging** (dev-only): loguea método, url, status, duración; nunca el body ni `Authorization`.
  2. **Renovación + mapeo de errores**: si `401` y la petición no es ya un retry ni es `/auth/refresh` en sí misma, coordina una única renovación compartida (`refreshCoordinator.ts`) y reintenta la petición original una sola vez (`config._retry = true`). Si falla la renovación o ya era un retry, limpia sesión y mapea el error con `errorMapper`.
- Reintento con backoff (`500ms`, `1500ms`) solo para `GET` con `NetworkError`/`TimeoutError`, máximo 2 intentos extra, implementado dentro del mismo interceptor de error (antes de la lógica de 401).

## 2. `services/api/refreshCoordinator.ts` (nuevo)

Módulo con una variable de módulo `refreshPromise: Promise<void> | null`. `coordinateRefresh(refreshFn)` reutiliza la promesa en curso si existe; si no, la crea, la limpia en `finally`. Evita renovaciones concurrentes cuando varias peticiones expiran a la vez.

## 3. Modelos con schema Zod

- `types/api/routines.ts`: `routineSchema` (Zod) + `type Routine = z.infer<typeof routineSchema>`. `description` ya es `string | null` en el backend → `.nullable()`. Comentario `// divergencia:` donde aplique (ninguna hoy en `Routine`, se deja el patrón documentado para cuando aparezca).
- `types/api/auth.ts`: `sessionUserSchema` (Zod) + `type SessionUser = z.infer<typeof sessionUserSchema>`.

## 4. Capa de datos — remoto / local / repositorio

- `services/api/endpoints/routines.ts` (remoto): agrega parámetro `signal?: AbortSignal`.
- `services/local/routinesLocalSource.ts` (local, nuevo): cache de listados/detalle sobre `@capacitor/preferences` (JSON), TTL simple.
- `services/local/outboxQueue.ts` (nuevo): cola de creaciones pendientes sobre `@capacitor/preferences`, procesada por el repositorio cuando `navigator.onLine` vuelve a `true`.
- `services/repositories/routinesRepository.ts` (nuevo): único punto que habla con remoto+local+outbox. `hooks/useRoutines.ts` pasa a importar el repositorio, nunca `endpoints/routines.ts` directamente.
- `hooks/useNetworkStatus.ts` (nuevo, transversal): wrapper sobre eventos `online`/`offline` del navegador (WebView los soporta igual).

## 5. Config / seguridad

- `config/env.ts`: agrega `isProduction`, `assertSecureProductionConfig()` (lanza si `PROD` y `apiBaseUrl` no empieza con `https://`, con excepción documentada para hosts de emulador `10.0.2.2`/`localhost`). Se invoca desde `main.tsx` al arrancar.
- Ninguna clave/secreto nuevo se incrusta — el chatbot es 100% local (reglas), sin API key.

## 6. Chatbot

- `features/chatbot/lib/intents.ts`: intenciones basadas en palabras clave (rutinas, puntos, navegación, ayuda) — sin red.
- `features/chatbot/components/ChatbotWidget.tsx`: burbuja flotante + panel de mensajes, accesible (roles ARIA, foco).
- Integrado en `Home.tsx`.

## 7. Verificación

`yarn lint && yarn typecheck && yarn test` + prueba dedicada de renovación forzando `401` (`apiClient.refresh.test.ts`).
