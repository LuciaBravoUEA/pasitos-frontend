# 009 · Navegación, estado y flujo CRUD verificable

**Estado:** bloqueada por contrato backend inexistente

> Verificación directa del 2026-08-30: el backend disponible en `C:\Nueva carpeta\pasitos-backend` solo contiene rutas de health y autenticación (`mobile/login`, `mobile/register`, `session`). No contiene organizaciones, sedes ni rutinas. Los contratos de organizaciones documentados previamente pertenecen al backend histórico `canchago`, que no está disponible en este entorno. No implementar estas pantallas contra endpoints inexistentes.

## Qué hace

Completa la arquitectura de navegación y estado solicitada para la entrega académica mediante un recorrido real de inicio de sesión, listado, detalle y creación. Usa organizaciones como entidad demostrativa porque es el recurso con contratos de listado, detalle y creación verificados que no depende del bug conocido de permisos del módulo de usuarios.

No se presentan las rutinas locales como datos remotos. El backend todavía no ofrece endpoints de rutinas, recompensas o reportes.

## Mapa de rutas

| Dirección | Acceso | Pantalla | Endpoint consumido |
|---|---|---|---|
| `/login` | Pública | Inicio de sesión web/nativo | Web: `GET /api/auth/login`; nativo: `POST /api/auth/mobile/login` |
| `/registro` | Pública, solo entorno nativo/local | Creación de cuenta de desarrollo | `POST /api/auth/mobile/register` |
| `/home` | Privada | Panel principal | `GET /api/auth/session`; logout: `POST /api/auth/logout` |
| `/organizaciones` | Privada | Listado paginado | `GET /api/organizaciones?page&pageSize` |
| `/organizaciones/nueva` | Privada | Formulario de creación | `POST /api/organizaciones` |
| `/organizaciones/:organizationId` | Privada y parametrizada | Detalle reconstruible | `GET /api/organizaciones/{organizationId}` |
| `/organizaciones/:organizationId/sedes` | Privada, parametrizada y anidada | Sedes de una organización | `GET /api/organizaciones/{organizationId}/sedes?page&pageSize` |

La ruta de sedes demuestra anidamiento conceptual y técnico bajo el recurso padre. Cada pantalla obtiene sus datos desde los parámetros de URL y su endpoint; no recibe objetos completos mediante `location.state`.

## Enfoque de navegación

Se mantiene `IonReactRouter` con React Router 5 porque Ionic React 8 depende oficialmente de esa integración en este proyecto. Se usa navegación jerárquica basada en recursos:

- rutas públicas para entrada al sistema;
- rutas privadas para datos de cuenta y organización;
- segmentos dinámicos para identidades reconstruibles;
- query string para paginación y filtros compartibles;
- rutas hijas para recursos que dependen de una organización.

No se adopta un tab bar porque el alcance actual tiene un flujo administrativo pequeño y jerárquico, no tres o más áreas principales equivalentes. La pila de Ionic conserva las transiciones y el botón atrás esperados en móvil.

## Reconstrucción mediante dirección

- `/organizaciones?page=2` reconstruye el listado y página solicitada desde la URL.
- `/organizaciones/{uuid}` obtiene el detalle usando `organizationId`.
- `/organizaciones/{uuid}/sedes?page=1` obtiene el padre por parámetro y su colección anidada.
- Recargar o abrir un deep-link no depende de objetos transportados por otra pantalla.
- UUID inválido produce un estado de error local comprensible sin llamar a un endpoint mal formado.

## Protección y retorno tras login

Cuando una ruta privada no tiene sesión válida, `ProtectedRoute` redirige a:

```text
/login?returnTo=<ruta-y-query-codificadas>
```

Después del login nativo, la aplicación usa `history.replace(returnTo)`. En web, el destino se conserva en una preferencia no sensible antes de la redirección OAuth y se recupera al resolver la sesión. Solo se aceptan rutas internas de una lista permitida; nunca URLs absolutas.

Un 401 limpia sesión/token y redirige al login conservando el destino. Un 403 mantiene la sesión, muestra “No tienes permiso para realizar esta acción” y permite volver; no se trata como sesión expirada.

## Clasificación del estado

### Estado efímero

- foco, visibilidad de contraseña y mensajes transitorios;
- apertura/cierre de diálogos;
- borrador del formulario de organización;
- filtros todavía no aplicados;
- feedback local de interacción.

Mecanismo: estado React local y React Hook Form. El borrador que debe sobrevivir navegación se persiste como preferencia no sensible con una clave acotada y se elimina al crear/cancelar.

### Estado de aplicación

- token nativo: almacenamiento seguro cifrado, nunca Zustand ni Preferences;
- usuario autenticado y estado de sesión: Zustand como espejo síncrono transversal;
- datos remotos de sesión, organizaciones y sedes: TanStack Query;
- página/filtro reconstruible: URL query string;
- destino pretendido: query string y preferencia no sensible durante OAuth web.

La separación evita copiar server-state a Zustand, conserva caché/invalidation de TanStack Query y mantiene secretos fuera de almacenamiento no cifrado.

## Tipo cerrado para operación remota

Las pantallas adaptarán el resultado de TanStack Query a un discriminated union con casos mutuamente excluyentes:

```ts
type RemoteData<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'success'; data: T };
```

`RemoteData<T>` alimenta `ResourceState`, componente del catálogo de la feature 008. No habrá combinaciones inválidas como `isLoading: true` junto con `data` y `error`.

## Formulario de organización

El formulario de creación se derivará del request real de `POST /api/organizaciones`, que debe confirmarse en el backend o en el contrato verificado antes de escribir el schema. React Hook Form usará `mode: 'onBlur'` y volverá a ejecutar Zod al enviar.

Cada mensaje identifica campo y corrección, por ejemplo: “Nombre: escribe al menos 2 caracteres”. Los `details[]` de `VALIDATION_ERROR` se asocian mediante `setError` únicamente para nombres de campo permitidos.

## Diferencia contractual sobre 422

El backend integrado no devuelve actualmente 422: `api-integration.md` confirma `VALIDATION_ERROR` con HTTP 400 y señala que `BUSINESS_RULE_ERROR` 422 está reservado pero ningún endpoint lo lanza. Por tanto:

- se implementará la asociación de errores de campo para el contrato real `400 VALIDATION_ERROR`;
- el flujo podrá asociar `details[]` también si el backend adopta posteriormente HTTP 422 con el mismo envelope, sin inventar un nuevo código;
- la evidencia académica declarará esta diferencia explícitamente;
- no se fabricará una respuesta 422 en producción como si fuera contrato vigente.

Si el profesor exige observar literalmente una respuesta 422 real, se necesita aprobación y trabajo previo en el backend, fuera del alcance de este repositorio.

## Conservación del formulario

El borrador no sensible de organización se guarda al cambiar campos mediante el wrapper de Preferences, se restaura al montar y se elimina al crear correctamente o cancelar expresamente. La contraseña y los tokens nunca participan en este mecanismo.

## Criterios de aceptación

- [ ] Existe un mapa actualizado de dirección, pantalla, acceso y endpoint.
- [ ] El router contiene rutas públicas, privadas, parametrizadas y al menos una ruta anidada.
- [ ] Listado, detalle y sedes se reconstruyen desde URL/path/query sin `location.state`.
- [ ] `ProtectedRoute` conserva y valida `returnTo`.
- [ ] Login vuelve al destino pretendido mediante reemplazo de historial.
- [ ] 401 y 403 producen comportamientos de navegación distintos.
- [ ] Token y usuario conservan los mecanismos seguros existentes.
- [ ] La documentación clasifica estado efímero, de aplicación, remoto y URL.
- [ ] Una operación remota usa `RemoteData<T>` y alimenta `ResourceState`.
- [ ] El formulario de organización se deriva del request real verificado.
- [ ] La validación ocurre en blur y submit, con mensajes correctivos por campo.
- [ ] Los detalles de validación del backend se asocian mediante lista blanca a campos.
- [ ] El borrador sobrevive navegación y se elimina tras éxito/cancelación.
- [ ] Se documenta honestamente que el backend usa 400 y no 422 actualmente.
- [ ] Existen evidencias del recorrido login → listado → detalle → creación.
- [ ] Lint, TypeScript, pruebas, build, sync y APK Android finalizan correctamente.

## Fuera de alcance

- Inventar endpoints para rutinas.
- Corregir el módulo backend de usuarios.
- Cambiar el backend para emitir 422 sin autorización explícita.
- Guardar contraseñas o tokens en Preferences, Zustand o URL.

## Decisión requerida

Para continuar existen dos opciones que requieren autorización explícita:

1. **Recomendada:** ampliar `pasitos-backend` con contratos de rutinas coherentes con la misión del producto: listado, detalle y creación, autenticación, autorización, validación de campos y error 422 verificable.
2. Recuperar y ejecutar el backend histórico `canchago` que contiene organizaciones/sedes, aunque esa entidad no representa el dominio principal actual de Pasitos Mágicos.

Hasta elegir una opción, no se implementa el flujo remoto ni se marca la feature como completada.
