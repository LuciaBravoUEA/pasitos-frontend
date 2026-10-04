# 017 · Historial permanente de actividades

**Estado:** implementada y verificada el 2026-10-03.

## Qué hace y por qué

Conservar un historial de las acciones sobre actividades para demostrar en PostgreSQL qué actividad realizó cada estudiante, cuándo y con qué estado. El usuario autorizó completar los faltantes, incluidos los cambios en backend y PostgreSQL, el 2026-10-03.

## Situación verificada

El modelo TaskCompletion y el repositorio del backend guardan un estado por estudiante, tarea y fecha mediante upsert. Desmarcar sobrescribe ese estado y borrar una rutina elimina sus cumplimientos en cascada. No constituyen un registro permanente de cada cambio.

Consulta de solo lectura en PostgreSQL el 2026-10-03: 13 tareas y 6 cumplimientos, distribuidos entre 2026-09-20 (3), 2026-09-21 (1) y 2026-10-01 (2). No se modificaron datos.

Implementación: `task_activity_events` conserva transiciones desde su despliegue, con snapshots de títulos. Los cumplimientos previos no se convierten en eventos. La verificación de PostgreSQL antes y después conservó 13 tareas, 6 cumplimientos y 14 cuentas; las cuentas temporales de prueba fueron eliminadas y quedaron 0 eventos de prueba.

## Contrato de API consumido

- POST /tareas/{taskId}/completar: {completed,date}; contrato existente verificado en el código del backend.
- GET /estudiantes/{studentId}/progreso?date=YYYY-MM-DD: progreso por fecha; contrato existente, no listado de eventos.
- GET /estudiantes/{studentId}/historial?page=1&pageSize=20&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD: listado paginado autorizado de cambios, con snapshots de títulos y hora de registro del servidor.

## Criterios de aceptación

- [x] Completar o desmarcar registra el cambio de estado con estudiante, actividad, rutina, fecha de actividad y hora del servidor.
- [x] Repetir una solicitud sin cambio de estado no genera eventos duplicados.
- [x] El historial conserva títulos y estados aunque se edite o elimine la rutina original.
- [x] El progreso diario actual conserva su funcionamiento.
- [x] Estudiantes solo consultan su historial; adultos solo el de estudiantes vinculados, con autorización en servidor y paginación.
- [x] Se documenta una consulta SQL para presentar el historial al profesor.
- [x] Datos previos se conservan; no se inventan eventos para cumplimientos existentes.
- [x] Tipos y contrato reflejan el backend implementado y verificado, sin any.

## Fuera de alcance

Auditar cada toque de interfaz, subir fotos, guardar contraseñas o tokens y reconstruir cambios que nunca fueron registrados.
