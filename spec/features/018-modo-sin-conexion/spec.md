# 018 · Modo sin conexión

**Estado:** implementada y verificada en Android; recorrido iOS pendiente en macOS/Xcode.

## Qué hace

Permite reabrir la app nativa en modo avión o sin internet después de iniciar sesión con conexión, y consultar las rutinas, el progreso propio y las páginas del historial previamente descargadas. Muestra «Sin conexión» y la fecha de última actualización. Al recuperar internet, valida la sesión y actualiza los datos.

## Por qué

La feature 010 ya incluye caché de rutinas y cola de creación, pero la sesión se consulta remotamente al arrancar y seguimiento/historial consumen directamente el API. Esa base no garantiza un recorrido completo sin conexión tras cerrar y reabrir la app.

## Contrato de API consumido

Contratos existentes documentados en `../../constitution/api-integration.md`, secciones 1–3; contrastar nuevamente con el backend antes de implementar:

- Consulta de sesión y login nativo existentes: la primera autenticación requiere conexión. La identidad local es una copia de una sesión previamente validada, no una nueva autenticación.
- GET `/rutinas` y GET `/rutinas/{id}`: conservar respuestas reales, detalles y metadatos de paginación.
- GET `/estudiantes/{studentId}/progreso?date=YYYY-MM-DD`: conservar el progreso recibido para el estudiante propio y la fecha exacta.
- GET `/estudiantes/{studentId}/historial?page=1&pageSize=20`: conservar cada página y sus metadatos reales.
- POST `/rutinas`: conservar la cola existente de creación, revisar sus límites sin prometer entrega exactamente una vez.

No requiere endpoints nuevos ni cambios de backend para este alcance.

## Criterios de aceptación

- [x] Tras iniciar sesión y descargar datos, cerrar y reabrir la app en modo avión permite consultar los datos propios guardados dentro de su vigencia local.
- [x] Sin sesión previamente validada, sin caché o con vigencia local vencida, la app explica que se necesita conexión; no simula autenticación ni datos.
- [x] Un error de red no borra una sesión válida; un 401 confirmado tras reconectar sí invalida el acceso y limpia datos sensibles.
- [x] La vigencia local se define y documenta antes de implementar, limitada por la expiración conocida de sesión; no se extiende sin validación remota.
- [x] Progreso e historial indican fecha consultada, última descarga y condición de datos desactualizados; páginas no descargadas muestran un estado explícito.
- [x] Caché aislada por cuenta, recurso, fecha, filtros y página; logout y cambio de cuenta impiden acceso a datos anteriores.
- [x] Identidad y datos educativos persistentes se protegen con almacenamiento cifrado nativo; no se guardan tokens ni datos sensibles en Preferences/localStorage/sessionStorage.
- [x] Recuperar conectividad valida la sesión antes de sincronizar la cola o actualizar vistas, sin solicitudes concurrentes duplicadas.
- [x] Se conserva la creación offline de 010 con estado pendiente visible; no se afirma que un UUID local evita duplicados en servidor.
- [x] Completar/desmarcar, editar/eliminar, vincular adultos y consultar estudiantes ajenos requieren conexión en esta primera etapa. La UI explica la limitación antes de enviar.
- [x] Estrellas, progreso y eventos históricos reflejan únicamente respuestas del servidor.
- [x] Android verifica pérdida de conexión con app abierta, reapertura en modo avión, reconexión, sesión vencida, logout y cambio de cuenta; iOS se valida o queda explícitamente pendiente.

### Contratos y tipos

- [x] Tipos y schemas reflejan contratos reales, sin `any`; se conservan envelopes y paginación.
- [x] Cualquier divergencia se documenta en api-integration.md antes de implementar.

## Fuera de alcance

- Primer login o registro sin internet.
- Marcar actividades offline y crear eventos retrospectivos: requiere otra propuesta que resuelva orden, conflictos e idempotencia del historial.
- Descargar automáticamente todos los estudiantes vinculados o todo el historial.
- Sincronización garantizada con la app cerrada o distribución web/PWA.
