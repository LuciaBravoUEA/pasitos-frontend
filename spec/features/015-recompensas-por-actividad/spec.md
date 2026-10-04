# 015 · Recompensas por actividad

Autorización: el usuario aprobó completar los faltantes de la funcionalidad principal conservando lo existente.

## Alcance

Cada tarea completada correctamente recibe una celebración visual y un sonido breve opcional en Inicio y Seguimiento. Las estrellas siguen siendo puntos por rutina completa calculados por el servidor. No se agregan puntos ficticios ni se cambia el contrato de cumplimiento.

Los reportes diarios para adultos vinculados se conservan. La vinculación desde la app y los informes semanales son mejoras opcionales fuera de esta corrección: requieren especificar nuevos contratos. No son necesarios para las recompensas prometidas.

## Aceptación

- Celebrar solo después de una respuesta correcta con completed=true, nunca al cargar, desmarcar o fallar una petición.
- Usar la misma experiencia en ambas pantallas; impedir envíos concurrentes.
- Sonido corto, suave y sin permisos de micrófono; control de silencio compartido y persistente en el dispositivo.
- Un fallo de audio no debe impedir guardar ni mostrar la recompensa visual.
- Respetar movimiento reducido, texto accesible y cierre de la celebración.
- Mantener rutinas, datos, sesión, estrellas y reportes existentes.
- Comprobar regresiones, checks completos y APK Android.
