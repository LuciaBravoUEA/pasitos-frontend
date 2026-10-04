# Capacidades del dispositivo

## Decisiones

Pasitos Mágicos incorpora solo capacidades con valor directo para rutinas y acompañamiento de niños con TDAH:

- **Notificaciones locales:** recuerdan una rutina pendiente y apoyan la constancia. Son opcionales; la app funciona sin ellas.
- **Cámara:** permite tomar una foto de perfil o evidencia de una rutina sin salir de la app. Es opcional.
- **Selector de fotos del sistema:** permite elegir una imagen existente para perfil o evidencia. Es opcional y no requiere acceso general a la galería.
- **Ajustes del sistema:** permite recuperar permisos denegados permanentemente.

Se descartaron ubicación, alarmas exactas y ejecución periódica en segundo plano porque no aportan valor esencial al producto. La sincronización se realiza al abrir la app y al recuperar la conexión.

## Plugins verificados

| Plugin | Versión | Cobertura | Uso adoptado |
| --- | --- | --- | --- |
| `@capacitor/local-notifications` | `8.3.1` | Android/iOS/Web parcial | Recordatorios opt-in, canal creado antes del primer aviso |
| `@capacitor/camera` | `8.2.4` | Android/iOS/Web parcial | `takePhoto` y Photo Picker; no se guarda automáticamente en galería |
| `capacitor-native-settings` | `8.2.0` | Android/iOS | Abrir ajustes tras denegación permanente |

Los tres plugins son compatibles con Capacitor 8 y se prefirieron frente a código nativo propio. La evaluación de mantenimiento, cobertura y compatibilidad está ampliada en `spec/features/011-capacidades-dispositivo/spec.md`.

## Permisos y propósito

| Plataforma | Permiso/capacidad | Propósito concreto | Momento |
| --- | --- | --- | --- |
| Android | `INTERNET` | Consultar autenticación, rutinas y progreso desde la API | Cuando se realizan peticiones |
| Android | `CAMERA` | Tomar una foto de perfil o evidencia de rutina | Al pulsar “Tomar foto” |
| Android | `POST_NOTIFICATIONS` | Avisar de una rutina pendiente | Al activar un recordatorio |
| Android | `SCHEDULE_EXACT_ALARM` | No utilizado | Eliminado del manifiesto final |
| iOS | `NSCameraUsageDescription` | Tomar una foto de perfil o evidencia de rutina; se guarda solo en el dispositivo | Al pulsar “Tomar foto” |
| iOS | `NSPhotoLibraryUsageDescription` | Elegir una imagen existente para perfil o evidencia; no se sube ni comparte | Al pulsar “Elegir foto” |

`VIBRATE`, `RECEIVE_BOOT_COMPLETED` y `WAKE_LOCK` pueden ser aportados por el plugin de notificaciones para su funcionamiento interno; no se solicitan como funcionalidades independientes de la app. No se declara permiso de escritura en galería.

## Matriz de degradación

| Situación | Comportamiento visible |
| --- | --- |
| Notificación aceptada | Se crea el canal y se programa el recordatorio aproximado. |
| Notificación cancelada o denegada | La rutina se guarda y funciona sin recordatorio. |
| Permiso denegado permanentemente | Se muestra explicación y botón para abrir ajustes. |
| Cámara no disponible o permiso denegado | “Tomar foto” no bloquea la rutina; se puede elegir una imagen o continuar sin foto. |
| Selector de fotos no disponible | La acción de elegir foto se oculta; el resto del perfil/rutina funciona. |
| Usuario cancela la cámara o selector | No se guarda ninguna imagen y la pantalla continúa funcionando. |
| Sin conexión | La app conserva caché local y las operaciones pendientes se sincronizan al recuperar conexión. |

Los permisos se comprueban antes de cada uso y nunca se solicitan durante el arranque.

## Nivel de API objetivo

- Android `minSdkVersion`: **24**
- Android `compileSdkVersion`: **36**
- Android `targetSdkVersion`: **36**
- Capacitor: **8.5.0**

La verificación manual en dispositivo físico de los estados concedido, denegado, denegado permanentemente, revocado durante el uso y capacidad ausente permanece como evidencia operativa pendiente.
