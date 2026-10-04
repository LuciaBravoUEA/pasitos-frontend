# Cuadros de permisos — Android

Verificado el 2026-09-20 en `emulator-5554`, paquete `com.pasitosmagicos.app`.

## Diagnóstico y corrección

`dumpsys package` mostraba CAMERA y POST_NOTIFICATIONS con `granted=true`. El sistema ya tenía autorización y no necesitaba volver a preguntar.

El checkbox de recordatorio ahora solicita permiso al activarse, antes de guardar la rutina. La explicación propia de cámara y notificaciones se cierra antes de pedir el permiso nativo. Los permisos se siguen solicitando al usar la capacidad, nunca automáticamente en el arranque.

## Verificación

- Lint, TypeScript, suite de tests y build correctos.
- Regresiones: marcar recordatorio solicita permiso sin crear rutina; desmarcar no solicita; Continuar espera el cierre del alert; cancelar no acepta el permiso.
- `cap:sync` correcto (requirió ejecución fuera del sandbox por fallo de consulta del usuario Windows).
- `assembleDebug`: BUILD SUCCESSFUL; `adb install -r`: Success, sin borrar datos.
- Tras restablecer exclusivamente los dos permisos, se invocaron `Camera.requestPermissions` y `LocalNotifications.requestPermissions` desde el WebView real por CDP. UI Automator confirmó que ambos cuadros pertenecen al controlador de permisos Android.
- [Cuadro de cámara](permission-camera-android.png).
- [Cuadro de notificaciones](permission-notifications-android.png).
- Al finalizar, ambos permisos quedan sin conceder y sin marcas user-set/user-fixed. También se restableció la caché `PluginPermStates.xml` de Capacitor: se verificó primero que contenía exclusivamente CAMERA y POST_NOTIFICATIONS rechazados por el cierre de los cuadros durante la prueba. No se borraron otros datos de la app.

La app estaba en login: no se recorrieron las pantallas autenticadas con una cuenta personal. El momento de solicitud desde la UI se cubrió con tests; los cuadros nativos se comprobaron mediante los plugins reales. No se tomó ninguna fotografía ni se programaron avisos. Queda pendiente la matriz completa en dispositivo físico/iOS.

## Cómo verlos

Después de iniciar sesión, toca **Tomar foto** para cámara. Para notificaciones, abre **Crear rutina** y marca **Recordarme esta rutina mañana**. Acepta **Continuar** en la explicación. Android mostrará su cuadro si el permiso sigue pendiente; una vez concedido, no repetirá la pregunta.
