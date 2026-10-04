# Auditoría del cliente HTTP

| Requisito | Implementación y evidencia |
| --- | --- |
| Cliente único | `src/services/api/apiClient.ts` crea la única instancia Axios; las pantallas no lo importan directamente. |
| Ambientes y base URL | `src/config/env.ts` lee constantes `VITE_*`; `.env.development` usa proxy y `.env.production` usa URL absoluta. |
| Timeout y estados | `apiTimeoutMs` es explícito. Axios aplica ese límite al tiempo total de conexión y respuesta; los códigos fuera de 2xx se entregan al interceptor de errores mediante `validateStatus`. |
| Token | El interceptor de request lee el Bearer desde `secureToken.ts`, que usa Keychain/Keystore. También lo envía en `/auth/refresh`, necesario para el flujo nativo. |
| Renovación | Un `401` marca `_retry`, coordina una única promesa en `refreshCoordinator.ts` y reenvía la solicitud original una sola vez. |
| Registro | El logger solo se ejecuta en desarrollo y redacta `Authorization`; producción no registra el detalle HTTP. |
| Modelos | `SessionUser` y `Routine` se derivan de schemas Zod; los opcionales usan `nullable`/`optional` y las divergencias tienen anotación explícita. |
| Fuentes de datos | `endpoints/routines.ts` es remoto, `local/routinesLocalSource.ts` es local y `routinesRepository.ts` orquesta ambos y la outbox. |
| Fallos | `errorMapper.ts` traduce validación, autenticación/autorización, no encontrado/conflicto, servidor, red, timeout y desconocido a errores de dominio. |
| Reintentos | El backoff automático solo aplica a `GET`; las mutaciones no se reintentan automáticamente. La cancelación usa `AbortSignal` de TanStack Query. |
| Secretos | No hay API keys ni secretos de servicio en `src`; las credenciales se introducen en el formulario y el token no se guarda en Preferences. |
| Producción | `assertSecureProductionConfig()` exige HTTPS fuera de los hosts locales documentados y el logger detallado está desactivado. |

## Orden de interceptores

Axios ejecuta los interceptores de request en orden LIFO y los de response en orden FIFO. Por eso la request usa una sola función para correlación, Bearer y log. En response se registra primero la respuesta y después se ejecutan renovación, backoff y mapeo de errores.

## Renovación forzada

`src/services/api/apiClient.refresh.test.ts` fuerza un primer `401`, comprueba la renovación, verifica el reintento único y cubre el caso en que la renovación también falla sin entrar en bucle. La validación contra expiración real de un token en emulador queda como prueba manual adicional.