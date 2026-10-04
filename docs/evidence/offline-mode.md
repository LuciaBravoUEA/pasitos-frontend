# Evidencia de modo sin conexión — 018

Validación realizada el 2026-10-04 con el APK nativo en emulador Android, backend real y cuentas temporales propias. Script reproducible: `scripts/verify-android-offline.mjs`. No se modificó el código del backend.

## Resultados

| Recorrido | Resultado |
| --- | --- |
| Primer acceso en modo avión | Exige conexión; no crea una sesión local. |
| Descargar datos, cerrar y reabrir en modo avión | Restaura la sesión vigente y muestra progreso, rutinas y detalle propios. |
| Historial descargado y página no descargada | Muestra la página guardada; la ausente tiene aviso y permite volver a la anterior. |
| Operaciones remotas sin conexión | Completar/desmarcar y editar quedan bloqueados. |
| Crear una rutina sin conexión | Conserva la creación pendiente; los registros nativos de IndexedDB están cifrados. |
| Reconectar | Valida la sesión y sincroniza la creación; el servidor contiene una sola rutina con ese título de prueba. |
| Vigencia local vencida | Exige conexión al reabrir. Se simuló venciendo únicamente el snapshot seguro de la cuenta de prueba; no se esperaron 24 horas ni se forzó la expiración del token del servidor. |
| Sesión revocada en servidor | El rechazo remoto impide restaurar el snapshot. |
| Cerrar sesión en modo avión y reabrir | Permanece en el acceso; la caché anterior no restaura la identidad. |
| Cambiar de cuenta y reabrir sin conexión | La segunda cuenta conserva su propio estado vacío, sin datos de la primera. |

Las cuentas y el perfil Android temporales se eliminaron al terminar; se restauraron el perfil y los ajustes de red originales.

## Capturas

- [Inicio en modo avión](018-android/inicio-offline.png).
- [Historial descargado](018-android/historial-offline.png).
- [Detalle de rutina](018-android/rutina-offline.png).
- [Creación pendiente](018-android/cola-offline.png).
- [Reconexión](018-android/reconexion.png).
- [Segunda cuenta aislada](018-android/otra-cuenta-offline.png).

## Verificación y límites

Lint, typecheck, 151 pruebas en 44 archivos, build, `cap:sync` y `assembleDebug` satisfactorios. APK instalado y recorrido anterior comprobado. Las pruebas automatizadas cubren también errores de red/timeout, rechazo de sesión, cifrado, vigencia, aislamiento y respuesta incierta de creación.

El acceso local dura como máximo 24 horas desde la última validación remota y nunca supera la expiración conocida de sesión. Solo se consultan datos previamente descargados de la cuenta propia. Completar/desmarcar, editar/eliminar, vincular acompañantes y consultar estudiantes ajenos requieren conexión. Una respuesta perdida de POST suspende el reenvío automático: no se promete entrega exactamente una vez.

iOS tiene sincronización de Capacitor verificada; su recorrido nativo queda pendiente en macOS/Xcode. No se validó un dispositivo físico ni la sincronización con la app cerrada.
