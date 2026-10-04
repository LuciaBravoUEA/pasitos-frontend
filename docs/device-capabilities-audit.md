# Auditoría de capacidades del dispositivo

## Decisiones de producto

| Capacidad | Valor para Pasitos Mágicos | Esencial | Decisión |
| --- | --- | --- | --- |
| Notificaciones locales | Recordar una rutina pendiente y apoyar la constancia | No; la rutina funciona sin aviso | Adoptada, opt-in y solicitada al activar un recordatorio |
| Selector de fotos del sistema | Adjuntar una evidencia visual ya existente | No; completar la rutina no depende de la foto | Adoptado con Photo Picker, sin permiso de galería |
| Cámara | Tomar una evidencia inmediata sin salir de la rutina | No; completar la rutina no depende de la foto | Adoptada, opt-in, con `CAMERA`/`NSCameraUsageDescription` |
| Ubicación y alarmas exactas | No aportan valor al flujo actual | No | Descartadas |
| Ejecución periódica en segundo plano | No es necesaria; la cola se sincroniza al abrir y al recuperar conexión | No | Descartada |

## Plugins y permisos

Se usan plugins mantenidos del ecosistema Capacitor compatibles con Capacitor 8: `@capacitor/local-notifications`, `@capacitor/camera` y `capacitor-native-settings`. La cobertura Android/iOS y las versiones están registradas en `spec/features/011-capacidades-dispositivo/spec.md`; no se escribió código nativo propio.

Android declara `INTERNET`, `POST_NOTIFICATIONS` y `CAMERA`. El manifest merger elimina explícitamente `SCHEDULE_EXACT_ALARM`, que el plugin declara por defecto aunque la aplicación agenda notificaciones inexactas. `VIBRATE`, `RECEIVE_BOOT_COMPLETED` y `WAKE_LOCK` son permisos de implementación del plugin para entregar notificaciones; la app no los solicita como diálogos interactivos.

iOS declara `NSPhotoLibraryUsageDescription` y `NSCameraUsageDescription`, con explicaciones concretas para seleccionar o tomar una evidencia de rutina. No se declara permiso de escritura en galería.

El proyecto incluye `ios/App/App/PrivacyInfo.xcprivacy` con seguimiento desactivado, cero datos recopilados y cero APIs de acceso declaradas por la app. La inspección local no encontró un archivo `PrivacyInfo.xcprivacy` dentro de las versiones instaladas de los tres paquetes adoptados; no se modifica `node_modules`. Antes de distribuir, el build iOS debe verificar que los artefactos transitorios de cada plugin aporten el manifiesto que corresponda o actualizar el plugin si Apple lo exige.

## Flujo y degradación

Los permisos se comprueban justo antes de cada uso. El flujo de cámara muestra una explicación propia antes del diálogo y ofrece ajustes en denegación permanente; nunca bloquea la rutina si la capacidad falta. Si el plugin no está disponible, las acciones de foto se ocultan y la rutina sigue funcionando. La outbox y la caché local cubren la indisponibilidad de red; no se depende de ejecución periódica en segundo plano.

## API objetivo y pruebas

El proyecto usa `compileSdkVersion` y `targetSdkVersion` `36`, con `minSdkVersion` `24`. La matriz manual requiere probar en dispositivo físico: permiso concedido, denegado, denegado permanentemente, revocado durante el uso y capacidad ausente. Esos recorridos no se pueden afirmar desde Vitest ni desde el emulador sin reproducir cada estado del sistema; quedan registrados como evidencia manual pendiente.