# 014 · Rutinas persistentes completas y presentación

Autorizado por el usuario el 2026-10-01: completar los faltantes revisados, incluido el backend local, y guardar los cambios en disco.

## Alcance y contrato propuesto

- El inicio consulta progreso real; elimina tareas, estrellas y rachas ficticias.
- POST /api/rutinas acepta `tasks?: string[]` (1–20 títulos de 2–80 caracteres). Si se omite, crea una tarea con el título de la rutina para compatibilidad con clientes/colas anteriores. Creación atómica de rutina y tareas.
- GET de detalle incluye `tasks: {id,title,description,position}[]`.
- PUT /api/rutinas/{id} actualiza título, descripción, categoría y puntos. No reemplaza tareas ni cumplimientos.
- POST /api/rutinas/{id}/tareas añade una tarea con `{title}`.
- DELETE /api/rutinas/{id} elimina la rutina propia y sus tareas/cumplimientos en cascada, previa confirmación en UI.
- Todas las operaciones verifican sesión, permiso y propiedad; 422 para entradas inválidas, 404 para recursos ajenos/inexistentes, 401/403 según autorización.
- El progreso incluye `totals.stars`: suma de puntos de rutinas con todas sus tareas completas en la fecha consultada; cálculo exclusivo del servidor.
- Edición, eliminación y tareas nuevas requieren conexión. Creación offline conserva tareas en la cola existente.
- No se modifican cuentas ni relaciones existentes automáticamente. Se documenta preparación de cuentas y grabación.

## Aceptación

1. Registrar usuario, crear rutina con tareas, completar/desmarcar y volver a consultar conserva los datos.
2. Inicio y seguimiento muestran el mismo progreso remoto, incluido tras volver a una pantalla cacheada por Ionic.
3. Editar conserva las tareas; cancelar eliminar conserva el registro; confirmar elimina solo la rutina seleccionada del propietario.
4. Validación cliente/servidor y aislamiento entre dos usuarios probados.
5. No se muestran datos eliminados desde la caché local ni se mantienen recordatorios pendientes de esa rutina.
6. Archivos guardados en ambos repositorios; guía de arranque independiente del IDE y guion de evidencia.
7. Lint, tipos, tests, build y sync; ejecución real y persistencia verificadas cuando el entorno permita arrancar PostgreSQL/Android, con límites explícitos.
