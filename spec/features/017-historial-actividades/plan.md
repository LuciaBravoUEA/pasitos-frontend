# 017 · Plan

1. Especificación y cambios de backend autorizados por el usuario el 2026-10-03.
2. Migración aditiva de eventos históricos con copias de títulos; los eventos no tienen FK a rutinas/tareas y se eliminan en cascada al borrar la cuenta del estudiante.
3. Guardar cada transición efectiva junto con el estado actual en transacción serializable; reintentar conflictos y no duplicar eventos al repetir un estado.
4. Exponer un listado paginado, filtrable por fechas y autorizado por las relaciones educativas vigentes.
5. Integrar tipos, API, hooks y pantalla accesible de historial en el cliente.
6. Verificar persistencia, desmarcado, borrado de rutina, concurrencia y aislamiento con cuentas temporales; documentar consulta SQL sin exponer datos personales.
7. Ejecutar las comprobaciones y actualizar el roadmap.

## Riesgos

- Los cambios pasados sobrescritos no pueden recuperarse. No presentar los cumplimientos previos como una auditoría completa.
- El historial no debe permitir que un adulto desvinculado siga consultando datos. Verificar la relación actual en cada lectura.
