# Contrato vigente — Pasitos Mágicos ↔ pasitos-backend

Verificado leyendo el backend local y mediante HTTP + PostgreSQL el 2026-10-01. El usuario autorizó completar el backend el mismo día. Las notas anteriores sobre Canchago, organizaciones y Keycloak se conservan en `api-integration-historico.md`; no describen el servidor local actual.

## 1. Entorno y autenticación

Backend Next.js en Docker, puerto host 3001, Prisma + PostgreSQL. Android Emulator: `http://10.0.2.2:3001/api`. HTTP se limita al desarrollo local; despliegue real requiere HTTPS.

- POST /auth/mobile/register: {name,username,email,password,role?} → 201 {data:{sessionToken,expiresAt}}. role admite exclusivamente estudiante/padre_familia/docente; ausente conserva estudiante; valores inválidos devuelven 422.
- POST /auth/mobile/login: {username,password} → 200 con el mismo envelope.
- GET /auth/session: Bearer → {data:{id,sub,username,email,name,roles,permissions,exp},meta:{timestamp}}. `exp` es la expiración UNIX en segundos, derivada de user_sessions.expires_at; verificado nuevamente en código el 2026-10-04 para la feature 018. El cliente usa esa expiración para limitar la consulta offline, nunca para crear o extender una sesión.
- POST /auth/refresh: 204, extiende la sesión aún vigente conservando token.
- POST /auth/logout: 204, revoca la sesión.
- Contraseña con scrypt y sal; token opaco aleatorio, hash SHA-256 en user_sessions. Cuentas y sesiones persisten en PostgreSQL.
- Registro público admite estudiantes, padres/madres y docentes. El rol se asigna en el servidor; el acceso al progreso de otro usuario requiere una relación autorizada desde la cuenta del estudiante.
- Cliente nativo guarda el token en almacenamiento seguro. El flujo web antiguo no forma parte de la demostración nativa.

## 2. Rutinas y tareas — feature 014

Permisos `rutinas.read` y `rutinas.manage`; consultas y escrituras siempre filtradas por usuario autenticado.

| Ruta | Método | Respuesta |
|---|---|---|
| /rutinas?page=1&pageSize=10 | GET | {data:Routine[],meta:{page,pageSize,total,totalPages}} |
| /rutinas | POST | 201 {data:Routine} |
| /rutinas/{id} | GET | {data:RoutineDetail} |
| /rutinas/{id} | PUT | {data:RoutineDetail} |
| /rutinas/{id} | DELETE | 204; cascada de tareas y cumplimientos |
| /rutinas/{id}/tareas | POST | 201 {data:{id,routineId,title,description,position,createdAt}} |

Routine: {id,userId,title,description:string|null,category,points,completed,createdAt}. El campo histórico `completed` no representa el cumplimiento diario; la UI usa seguimiento para ese estado.

RoutineDetail añade `tasks: {id,title,description:string|null,position}[]`; el servidor puede devolver propiedades adicionales que Zod elimina.

POST/PUT de rutina: {title,description?,category,points}. Título 2–80, descripción hasta 240, categoría ESCUELA/HOGAR/CALMA/AUTOCUIDADO, puntos enteros 1–100. POST admite además `tasks?:string[]`, 1–20 pasos de 2–80 caracteres. Si se omite, crea una tarea con el título de la rutina. Rutina y tareas se crean atómicamente. PUT conserva tareas y cumplimientos; usar POST anidado {title} para añadir un paso. No hay edición/eliminación individual de pasos.

DELETE solo elimina la rutina propia tras la confirmación de UI. El cliente invalida caché y limpia foto local, intención de recordatorio y notificación de esa rutina. Edición, eliminación y alta de pasos requieren conexión; solo la creación tiene cola offline.

## 3. Seguimiento educativo

- GET /estudiantes/asignados?date=YYYY-MM-DD: padre/tutor mediante student_guardians; docente mediante student_teachers.
- GET /estudiantes/{studentId}/progreso?date=YYYY-MM-DD: estudiante propio o adulto relacionado.
- POST /tareas/{taskId}/completar: {completed:boolean,date:YYYY-MM-DD}; exclusivamente estudiante propietario. Devuelve tarea con cumplimiento.
- Cumplimiento único por (studentId,taskId,activityDate), mediante upsert.
- GET /estudiantes/{studentId}/historial?page=1&pageSize=20&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD: historial paginado de cambios de estado. Los filtros de fechas son opcionales y se aplican a `activityDate`; `pageSize` admite 1–100.
- Historial: {data:TaskActivityEvent[],meta:{page,pageSize,total,totalPages}}. Cada evento contiene {id,studentId,taskId,routineId,taskTitle,routineTitle,completed,activityDate,recordedAt}. El API comprueba en cada lectura que el estudiante consulta su cuenta o que el adulto conserva su vínculo vigente.
- Al completar o desmarcar, el servidor guarda la transición efectiva en `task_activity_events` junto con snapshots de los títulos y hora de registro del servidor. Cambios y estado actual se escriben en una transacción serializable; repetir el estado actual no añade evento. Eventos sobreviven a editar/eliminar tareas o rutinas, pero se eliminan al borrar la cuenta del estudiante.
- Eventos anteriores al despliegue no se reconstruyen ni se importan: `task_completions` conserva solo el estado diario actual.
- Progreso: {student:{id,name,email},date,routines:[{id,title,description,category,tasks:[{id,routineId,routineTitle,title,description,position,completed,completedAt}]}],totals:{tasks,completed,pending,progressPercent,stars}}.
- `stars` es la suma de puntos de rutinas con al menos una tarea y todos sus pasos completos en la fecha consultada. Se calcula únicamente en backend. Desmarcar o añadir tareas puede reducirlo.
- El cliente envía fecha local del dispositivo. No inventa rachas ni conserva un progreso alternativo en Home.

## 4. Errores y fronteras

{error:{code,message,details?:[{field,message,type}]}}. Validación 422, sesión 401, autorización 403, rutina ajena/inexistente 404; fallos internos 500 con mensaje genérico. Se comprueban permisos en servidor aunque el cliente oculte acciones.

Fotos de perfil/evidencia y recordatorios son locales. No existe contrato de subida de archivos ni estadísticas históricas de rachas. El chatbot es ayuda local sin API externa.

## 5. Vinculación educativa — feature 016

Implementada y contrastada leyendo el backend y con HTTP + PostgreSQL. Reutiliza student_guardians/student_teachers, sin migraciones.

- GET /acompanantes → {data:{username,companions:Companion[]}}. Devuelve el usuario propio y, para estudiantes, los acompañantes autorizados. Para adultos devuelve companions vacío e información para compartir su usuario.
- POST /acompanantes/buscar {username} → {data:Companion}; solo estudiante; coincidencia exacta normalizada (trim/lowercase), 1–100 caracteres. No devuelve correo ni permite buscar estudiantes.
- POST /acompanantes {adultId:UUID} → 200 {data:Companion}; solo estudiante autenticado. Crea su relación con el adulto, sin duplicados aun con solicitudes simultáneas (createMany + skipDuplicates e índice único).
- DELETE /acompanantes/{adultId} → 204; solo estudiante autenticado; elimina exclusivamente su relación, de forma idempotente. No elimina cuentas, rutinas ni cumplimientos.
- Companion: {id,name,username,role:padre_familia|docente}. Roles previos padre/tutor se normalizan a padre_familia para presentación.
- Errores 401/403/404/422/500, con el envelope existente. El servidor deriva studentId de la sesión; no acepta la identidad de otro estudiante para autorizarlo. Los adultos no pueden autoasignarse ni modificar tareas ajenas.

## 6. Evidencia

## 7. Historial permanente — feature 017 (2026-10-03)

Implementación aditiva autorizada por el usuario: migración `013_task_activity_history`, eventos append-only para cada transición real de completar/desmarcar y endpoint paginado. Los eventos copian títulos de actividad y rutina; no tienen FK a esas entidades para sobrevivir a su edición/eliminación. La cuenta del estudiante sí conserva la relación de borrado en cascada.

La base preexistente no tenía historial de migraciones Prisma. Se verificaron las tablas, columnas, índices y restricciones de seguimiento de `012_student_tracking`; se marcó esa migración como baseline y se aplicó únicamente la migración aditiva 013. `scripts/verify-task-history.mjs` comprobó repetición concurrente sin duplicados, progreso diario, paginación, filtros, permisos de estudiante/docente, retirada de vínculo, snapshots tras editar/eliminar la rutina y limpieza de datos temporales. Conteos antes/después: 13 tareas, 6 cumplimientos y 14 cuentas; después de limpiar pruebas, 0 eventos temporales. Los seis cumplimientos anteriores no se importaron al historial.

`scripts/verify-educational-links.mjs`: registro de tres perfiles y compatibilidad anterior, rechazo de admin, búsqueda mínima, autorización, solicitudes simultáneas, aislamiento, lectura de adultos, PostgreSQL directo, reinicio, persistencia y revocación. Satisfactorio el 2026-10-01; cuentas temporales propias eliminadas.

`scripts/verify-routine-flow.mjs` crea cuentas temporales propias y prueba registro, rutina con pasos, edición, alta de tareas, cumplimiento repetido, aislamiento, padres/docentes relacionados, PostgreSQL directo, reinicio del backend, conservación de sesión/datos, desmarcado, cascada y logout. Limpia únicamente sus cuentas temporales.

Prueba ejecutada satisfactoriamente el 2026-10-01. No se modificaron registros preexistentes. Guía de grabación: `docs/guia-video-tutorial.md`.
