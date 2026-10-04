# 010 · Endurecimiento del cliente HTTP, capa de datos offline y chatbot de ayuda

## Qué

Trabajo académico ("Semana 13") que endurece la capa `services/api/` existente (feature `001`) y agrega:

1. Interceptor de renovación de sesión ante `401` con reintento de la petición original, bandera anti-bucle y coalescencia de renovaciones concurrentes.
2. Interceptor de registro (logging) solo en desarrollo, con el encabezado `Authorization` redactado.
3. Reintentos con espera creciente exclusivamente para operaciones idempotentes (`GET`) ante fallos de red/timeout.
4. Cancelación de peticiones cuando la pantalla que las originó se desmonta (vía `AbortSignal` de TanStack Query).
5. Separación explícita fuente remota / fuente local / repositorio para el dominio `rutinas`, con una cola de salida (outbox) para creaciones hechas sin conexión (continúa el storage cifrado de la Semana 12: `services/storage/secureToken.ts`, `services/storage/preferences.ts`).
6. Modelos de al menos dos entidades (`Routine`, `SessionUser`) con schema Zod (serialización/validación generada por `z.infer`), campos opcionales anulables y anotación explícita de cada divergencia de nomenclatura con el backend.
7. Verificación de que ninguna pantalla llama directo a `apiClient` (ya se cumplía; se documenta la verificación).
8. Endurecimiento de configuración: HTTPS obligatorio en producción (con la única excepción documentada del alias de emulador `10.0.2.2`), registro detallado desactivado fuera de desarrollo, ninguna clave secreta incrustada.
9. Un chatbot de ayuda funcional dentro de la app (reglas + intenciones locales, sin backend de IA ni claves), integrado en `Home`.
10. Registro del uso de herramientas de IA en este trabajo (`docs/evidence/ai-usage-log.md`).

## Por qué

Requisito académico explícito del usuario que exige una arquitectura de red resiliente (renovación de token, cancelación, reintentos idempotentes, offline-first básico) y trazabilidad de las decisiones de seguridad, sobre una app que ya tiene autenticación real (features `002`/`003`) y storage cifrado (Semana 12 = `secureToken.ts`).

## Contrato de API consumido

Ver `spec/constitution/api-integration.md` §2/§3/§7/§9 y la tabla de correspondencia agregada en la sección "Registro de cambios" de ese documento (2026-09-19). Divergencia real detectada y **no implementada sin aprobación**: `POST /api/auth/refresh` responde `204` sin cuerpo (contrato actual, válido para el flujo cookie/web); el flujo nativo (Bearer) necesitaría un cuerpo `{ data: { sessionToken, expiresAt } }` igual al de `/auth/mobile/login` para poder rotar el token guardado en storage cifrado. Se implementa el interceptor para aceptar ambos casos (si hay cuerpo, rota el token; si es `204`, asume que el token sigue vigente) y se documenta la propuesta pendiente en `api-integration.md` — **no se modificó el backend**.

## Criterios de aceptación

- [ ] `apiClient.ts` tiene un único punto de creación de instancia Axios, `baseURL` desde constante de compilación (`env.ts`), timeout explícito, `validateStatus` documentado.
- [ ] 401 dispara renovación una sola vez por petición (`_retry`), no reintenta en bucle.
- [ ] Múltiples 401 simultáneos disparan una sola llamada de renovación (promesa compartida).
- [ ] El interceptor de log solo corre con `import.meta.env.DEV === true` y nunca imprime el header `Authorization`.
- [ ] Reintentos con backoff solo en `GET`; `POST`/`PATCH`/`DELETE` nunca se reintentan automáticamente.
- [ ] `listRoutines`/`getRoutine` aceptan `AbortSignal` y TanStack Query cancela la petición al desmontar la pantalla.
- [ ] Existe `routinesRepository` que es el único punto que ven los hooks; `endpoints/routines.ts` (remoto) y `local/routinesLocalSource.ts` (local) no se importan desde `features/*/pages`.
- [ ] Crear una rutina sin conexión la encola (`outboxQueue`) y se sincroniza sola al recuperar conectividad.
- [ ] `Routine` y `SessionUser` tienen schema Zod, campos opcionales marcados `.nullable()`/`.optional()` según corresponda, y comentario `// divergencia:` en cada campo cuyo nombre no coincide con el backend.
- [ ] `.env.production` exige HTTPS salvo excepción documentada del emulador; `assertSecureProductionConfig` lanza en build de producción si no se cumple.
- [ ] Chatbot responde localmente sobre rutinas/puntos/navegación sin ninguna llamada de red ni clave embebida.
- [ ] `docs/evidence/ai-usage-log.md` documenta herramienta, consultas, resultados usados, modificaciones y verificaciones.
