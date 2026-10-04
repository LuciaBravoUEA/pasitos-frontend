# 012 · Plan técnico

## Backend

1. Ampliar `prisma/schema.prisma` con `Task`, `StudentGuardian`, `StudentTeacher` y `TaskCompletion`, usando claves foráneas e índices únicos.
2. Crear SQL reproducible en `prisma/migrations/012_student_tracking/migration.sql` sin borrar datos.
3. Añadir repositorio de seguimiento con consultas filtradas por el usuario autenticado.
4. Añadir endpoints para estudiantes asignados, progreso y completar tareas.
5. Reutilizar `readSession` y comprobar rol + relación en cada request.
6. Crear datos de prueba mediante script idempotente, sin sustituir usuarios existentes.

## Cliente

1. Añadir tipos Zod y endpoints Axios bajo `services/api/endpoints/studentTracking.ts`.
2. Añadir hooks TanStack Query y páginas para estudiante, padre/tutor y docente.
3. Reutilizar `AppCard`, `AppButton`, `ResourceState`, `AppPage` y el tema existente.
4. Sustituir solo el marcado demostrativo de tareas por la mutación real cuando exista una tarea remota; mantener el home actual mientras se carga el nuevo resumen.
5. Añadir rutas protegidas y guards por rol.

## Verificación

- Backend: build, lint y pruebas de autorización/persistencia.
- Frontend: typecheck, lint, Vitest y Cypress para los tres roles.
- PostgreSQL: migración, datos de prueba, reinicio y consulta posterior.
