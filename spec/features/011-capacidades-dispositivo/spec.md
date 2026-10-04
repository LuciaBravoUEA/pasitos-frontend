# 011 · Capacidades del dispositivo (permisos, degradación, chatbot)

## Auditoría de capacidades — qué aporta valor real

| Capacidad | ¿Aporta valor real? | ¿Esencial? | Decisión |
|---|---|---|---|
| **Notificaciones locales** (recordar una rutina pendiente) | Sí — el refuerzo de hábito es el propósito central de la app (niños con TDAH necesitan recordatorios externos) | No — la app funciona perfectamente sin ellas, solo se pierde el recordatorio proactivo | **Incorporar**, opt-in por rutina |
| **Selector de fotos del sistema** (adjuntar evidencia visual a una rutina completada) | Sí — refuerzo positivo visual, valorado por el dominio (gamificación) | No — la rutina se completa igual sin foto | **Incorporar**, solo selector del sistema, sin permisos de galería |
| Cámara (capturar foto nueva) | Sí — permite registrar una evidencia inmediata de una rutina sin salir a la galería | No — la rutina funciona sin foto | **Incorporada**, opt-in desde el detalle de rutina |
| Ubicación (GPS) | Ninguno identificado — las rutinas no son geolocalizadas, no hay "check-in" por lugar | — | **Descartada explícitamente** — solo añadiría vistosidad, no valor |
| Ejecución periódica en segundo plano (`WorkManager`/`BGTaskScheduler`) | Ya cubierto por sincronizar al reconectar y al abrir la app (outbox de la feature `010`) | — | **Descartada** — no depender de scheduling en segundo plano |
| Alarmas exactas (`SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`) | El recordatorio de una rutina no es crítico al minuto (a diferencia de una alarma de despertador) | — | **Descartada** — se programa como recordatorio aproximado |

## Evaluación de plugins (cobertura, actividad, incidencias, versiones)

| Plugin | Mantenedor | Cobertura | Actividad reciente | Compatibilidad | Permisos que pide | Decisión |
|---|---|---|---|---|---|---|
| `@capacitor/local-notifications` `8.3.1` | Equipo oficial Ionic (`ionic-team`) | Android + iOS + Web (parcial) | Publicado hace 1 mes, changelog activo (errores estructurados añadidos en 8.3.0) | Rango de plugin `v8 >= 8.0.0` — coincide con Capacitor `8.5.0` del proyecto | Solo `POST_NOTIFICATIONS` (Android 13+); alarmas exactas opcionales y **no solicitadas** | **Adoptado** |
| `@capacitor/camera` `8.2.4` | Equipo oficial Ionic (`ionic-team`) | Android + iOS + Web (con PWA Elements opcional) | Publicado hace 18 días | Compatible con Capacitor 8 | `chooseFromGallery` usa Photo Picker; `takePhoto` requiere `CAMERA`, sin guardar automáticamente en galería | **Adoptado**, `chooseFromGallery` + `takePhoto` |
| `capacitor-native-settings` `8.2.0` | Comunidad (`raphaelwoude`, `dennisameling` — colaborador reconocido del ecosistema Capacitor) | Android + iOS | Publicado hace 1 mes, ~132k descargas/semana, PRs e issues con respuesta activa en GitHub | Rango de plugin `v8 >= 8.0.0` | Ninguno propio (invoca `Settings` del sistema operativo) | **Adoptado**, solo para el botón "Abrir ajustes" tras denegación permanente |

Descartado explícitamente: cualquier plugin de geolocalización (`@capacitor/geolocation` u otros) — no hay capacidad de ubicación en el alcance de esta feature (ver tabla de arriba).

## Permisos declarados

- **Android** (`AndroidManifest.xml`): `INTERNET`, `POST_NOTIFICATIONS` y `CAMERA`. No se declara `ACCESS_FINE_LOCATION`, `READ_MEDIA_IMAGES`, `SCHEDULE_EXACT_ALARM` ni `USE_EXACT_ALARM`.
- **iOS** (`Info.plist`): `NSPhotoLibraryUsageDescription` y `NSCameraUsageDescription`, ambas con cadenas específicas. No se declara `NSPhotoLibraryAddUsageDescription`; la foto de cámara no se guarda automáticamente en la galería.

## Matriz de degradación

Ver `plan.md` §6 para la tabla completa: qué ve la persona usuaria cuando el permiso está denegado, denegado permanentemente, el servicio (notificaciones del sistema) está apagado, o la capacidad no existe en la plataforma (Web/dev).

## Criterios de aceptación

### Verificación de cuadros de permiso (2026-09-20)

- Al activar «Recordarme esta rutina mañana» se muestra la explicación y, si se acepta y el permiso está pendiente, el diálogo nativo sin exigir guardar el formulario.
- «Tomar foto» conserva el flujo contextual de cámara. Si el permiso ya está concedido no se fuerza otro diálogo del sistema.
- La explicación termina de cerrarse antes de abrir el cuadro nativo. Cancelar no solicita permisos.
- Verificar en el emulador restableciendo solo CAMERA y POST_NOTIFICATIONS, sin borrar datos ni sesión.

### Correcciones autorizadas (2026-09-20)

- Los flujos de cámara y notificaciones comparten cuatro estados, distinguen indisponibilidad y resuelven cancelación/cierre del rationale.
- La creación de rutina no se repite por un fallo del recordatorio; el resultado y acceso a ajustes permanecen visibles.
- La intención de recordatorio offline se conserva localmente y se procesa sin pedir permisos automáticamente.
- Base local IndexedDB del WebView para caché, outbox y copias de imágenes; migración conservadora de Preferences, sin tokens ni nuevos contratos remotos.
- Sincronización autenticada al abrir, reconectar y volver al primer plano, con exclusión de ejecuciones concurrentes.
- Privacidad iOS registrada en Xcode, motivos de APIs según dependencias reales, textos de cámara/fotos incluyendo perfil.
- Pruebas de regresión automatizadas y matriz manual honesta; no declarar comprobados recorridos físicos/iOS sin ejecutarlos.

- [x] Ningún permiso se solicita en el arranque de la app — solo en el momento de uso real.
- [x] Antes de cada diálogo del sistema hay una explicación breve propia (rationale).
- [x] Los cuatro estados de permiso (`prompt`, `prompt-with-rationale`, `granted`, `denied`) tienen una reacción distinta y verificable.
- [x] Denegación permanente (`denied`) ofrece un botón que abre los ajustes de la app (`capacitor-native-settings`).
- [x] El estado del permiso se comprueba antes de cada uso, nunca cacheado desde el arranque.
- [x] El selector de fotos no requiere ningún permiso de galería declarado.
- [x] Ninguna acción de la app se bloquea ni cierra por falta de un permiso o capacidad — siempre hay una ruta de degradación.
- [x] `docs/evidence/ai-usage-log.md` actualizado con esta sesión.
