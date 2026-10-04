# Evidencia 014 — 2026-10-01

## Resultado

Implementación guardada en Pasitos-Magicos y pasitos-backend. No se borraron ni reemplazaron cuentas/rutinas preexistentes. Los scripts de verificación crean cuentas temporales únicas y las eliminan al terminar.

## Comprobaciones

- Frontend: lint y TypeScript correctos. Suite completa final: 112 pruebas correctas en 35 archivos, incluidas las regresiones de sesión y consistencia/caché/offline.
- Se limitaron los workers con VITEST_MAX_THREADS=2 y VITEST_MIN_THREADS=2 para evitar saturación mientras Docker y Android están abiertos. Un intento inicial con demasiados workers agotó el tiempo de una prueba existente; con los workers limitados pasa. No se aumentaron timeouts ni se omitieron pruebas.
- Build Vite correcto. Advertencias no bloqueantes existentes: tamaño del bundle e importación estática/dinámica del módulo auth.
- Backend: TypeScript y ESLint de módulos modificados correctos. Producción compila con NODE_ENV=production y next build --webpack. Se eliminó la dependencia de Google Fonts de la página auxiliar.
- API real + PostgreSQL: registro; creación atómica de rutina con pasos; validación 422; lectura/edición/alta/eliminación protegidas por propietario; cumplimiento idempotente; estrellas; visibilidad de padre y docente por relación; rechazo de acceso a estudiante ajeno; lectura directa en base de datos; reinicio real del backend; conservación de cuenta, sesión, tareas y cumplimientos; desmarcado; cascada y logout.
- PostgreSQL confirmado en volumen persistente pasitos-magicos_postgres_data. Backend y PostgreSQL con restart unless-stopped.
- Capacitor sync Android/iOS correcto.
- APK Android debug compilado e instalado en Pixel_6_Clean_New conservando datos.
- Recorrido del WebView nativo mediante eventos de formularios/botones: registro → inicio vacío → crear dos pasos → detalle → editar → añadir tercer paso → completar los tres → cerrar proceso Android → reabrir conservando sesión/progreso → listado → cancelar eliminación → confirmar eliminación → logout.
- No se sustituyó la API por mocks en las pruebas de API/Android. Los tests unitarios usan dobles explícitos.

## Capturas

- [Detalle editado con tareas](014-android/detalle-editado.png)
- [Inicio con tres pasos completos](014-android/inicio-completado.png)
- [Progreso después de reabrir](014-android/reapertura-persistente.png)
- [Eliminación confirmada](014-android/rutina-eliminada.png)

## Reproducción

- API/base de datos: node scripts/verify-routine-flow.mjs (reinicia el backend y usa cuentas temporales propias).
- Android: node scripts/verify-android-routines.mjs, con emulador iniciado, APK instalado y backend activo; crea su cuenta temporal y guarda capturas. La app termina en login.
- Build Android en este equipo: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-android-local.ps1, después de yarn.cmd build y yarn.cmd cap:sync. Copia los certificados estándar del JDK e incorpora las raíces públicas de AVG/RAV que Windows ya confía, solo en android/build/local-cacerts. No deshabilita HTTPS ni altera el almacén global.

## Límites

No se compiló ni ejecutó iOS en Windows. No se repitió la matriz completa de cámara/permisos en dispositivo físico ni la entrega de una notificación programada para mañana. Las fotos son locales y las relaciones educativas se administran en backend. La grabación del video y los nombres de integrantes corresponden al estudiante.

Durante la automatización Android se ajustaron selectores al shadow DOM de Ionic y se esperó al arranque del WebView. Los intentos incompletos también limpiaron exclusivamente sus cuentas temporales; el recorrido final pasó.

## Registro intermitente corregido

La última pasada encontró un 401 de una consulta anónima que llegaba después de guardar el token del registro. Se añadió una generación de sesión para rechazar respuestas antiguas y AbortSignal para cancelar consultas pendientes. Login/registro no provocan refresh por credenciales incorrectas. Tres pruebas específicas reproducen respuesta antigua, renovación tardía y rechazo de credenciales sin borrar otra sesión.
Validación final del APK con la corrección de sesión: recorrido completo Android satisfactorio el 2026-10-01; capturas actualizadas y cuenta temporal eliminada.
