# 017 · Tareas

- [x] Leer constitución, specs existentes, modelo Prisma y repositorio real.
- [x] Consultar conteos de PostgreSQL sin modificar registros.
- [x] Especificar faltantes y propuesta de implementación.
- [x] Confirmar alcance de esta feature nueva con el usuario.
- [x] Leer AGENTS.md del backend antes de modificarlo.
- [x] Migración aditiva e historial transaccional sin duplicados por solicitudes repetidas.
- [x] Contrato paginado con autorización por estudiante y relación educativa.
- [x] Tipos, API, hooks y pantalla de historial.
- [x] SQL para el profesor y evidencia de persistencia/aislamiento.
- [x] Actualizar api-integration.md con contrato verificado.
- [x] Ejecutar verificaciones y pruebas de persistencia: migración aplicada; integración API/PostgreSQL, persistencia de snapshots, concurrencia, permisos, filtros, paginación y datos previos comprobados.
- [x] Actualizar roadmap al completar la feature.

Nota de validación: el test de la pantalla, `yarn lint`, `yarn typecheck`, `yarn build`, el build del backend y ESLint de los archivos backend modificados pasan. La suite completa existente tiene un fallo de aislamiento/unhandled error en pruebas de `App`/`SessionGates`; las pruebas aisladas de esta feature pasan.
