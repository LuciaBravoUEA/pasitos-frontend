# 012 · Seguimiento de estudiantes para familias y docentes

## Objetivo

Persistir tareas y cumplimientos en PostgreSQL y permitir que cada estudiante vea sus rutinas, mientras que padres/tutores y docentes consultan únicamente estudiantes relacionados con su usuario.

## Alcance

- Mantener `users` y `routines` existentes.
- Añadir tareas, relaciones estudiante-padre, relaciones estudiante-docente y cumplimientos diarios.
- Autorizar en backend cada lectura y mutación.
- Añadir dashboards móviles para estudiante, padre/tutor y docente.
- No borrar usuarios, rutinas ni sesiones existentes.

## Modelo lógico

`User -> Routine -> Task -> TaskCompletion`.

`User(student) <- StudentGuardian -> User(guardian)`.

`User(student) <- StudentTeacher -> User(teacher)`.

Los roles se mantienen en `User.role_code` y se validan en backend. No se crea una tabla de roles duplicada.

## Criterios de aceptación

- Un estudiante puede listar sus rutinas y tareas.
- Completar una tarea crea o actualiza un cumplimiento del día en PostgreSQL.
- El mismo estudiante no genera duplicados para la misma tarea y fecha.
- El progreso se calcula desde tareas y cumplimientos reales, por fecha.
- Padre/tutor solo ve estudiantes de `student_guardians`.
- Docente solo ve estudiantes de `student_teachers`.
- Un acceso no autorizado responde `403` o `404` sin datos del estudiante.
- Padre y docente ven resumen y detalle de progreso.
- Las rutinas existentes siguen disponibles.
- La suite de backend y frontend cubre login, cumplimiento, progreso, aislamiento y persistencia tras reinicio.
