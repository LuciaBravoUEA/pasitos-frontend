# Plan técnico — 011

## 1. Estructura nueva

### Revisión técnica autorizada (2026-09-20)

Reutilizar el flujo puro de permisos mediante hooks compartidos y un confirmador que resuelva al cerrar el alert. Separar la creación remota del resultado del recordatorio. Persistir fecha/intención y el identificador remoto antes de procesar efectos opcionales para no recrear rutinas si falla el plugin. Comprobar permisos sin solicitarlos durante sincronización automática.

Introducir IndexedDB (API estándar disponible en WebViews Android/iOS, sin nuevo plugin ni permisos) con transacciones y migración diferida de los JSON de Preferences. Mantener tokens exclusivamente en SecureStorage. Guardar copias de imágenes locales limitadas en tamaño, nunca enviar fotos al backend. Montar un coordinador autenticado único para apertura/reconexión/resume y conservar el resto de pantallas y contratos. Retirar Haptics sin usos en src. Registrar el manifiesto de privacidad en recursos Xcode y auditar dependencias transitivas; la validación del archive iOS requiere Mac/Xcode.

```
src/services/device/
├── permissionCopy.ts        ← rationale + mensajes por permiso (sin genéricos, específicos del dominio)
├── notificationPermission.ts ← check/request envolviendo @capacitor/local-notifications, 4 estados
├── routineReminders.ts       ← crea canal, agenda/cancela recordatorio de una rutina
└── routinePhotoPicker.ts     ← chooseFromGallery envuelto con feature-detection

src/hooks/
└── usePermissionFlow.ts      ← hook genérico: rationale → request → 4 reacciones → deep link a ajustes
```

## 2. Los cuatro estados de permiso (idénticos en `@capacitor/local-notifications` y `@capacitor/camera`)

`PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'`

| Estado | Significado real | Reacción de la app |
|---|---|---|
| `prompt` | Nunca se pidió | Mostrar explicación breve propia → `requestPermissions()` |
| `prompt-with-rationale` | Se denegó una vez, el SO permite volver a preguntar | Mostrar una explicación más insistente (por qué de nuevo) → `requestPermissions()` |
| `granted` | Concedido | Proceder con la acción real (agendar recordatorio / abrir selector) |
| `denied` | Denegación permanente (Android "no preguntar de nuevo", o iOS tras la única negativa que el sistema permite) | Nunca volver a llamar `requestPermissions()` (el SO ya no muestra diálogo) — mostrar banner con botón "Abrir ajustes" (`capacitor-native-settings`) |

`checkPermissions()` se llama **antes de cada uso** (al tocar "Recordarme" o "Adjuntar foto"), nunca solo una vez al iniciar la app.

## 3. Notificaciones — recordatorio de rutina

- `routineReminders.ts`: `ensureChannel()` crea el canal Android `routine-reminders` (importancia por defecto, sin sonido custom) **antes** de la primera notificación — se invoca de forma perezosa (primera vez que el usuario activa un recordatorio), nunca en el arranque global de la app.
- `scheduleRoutineReminder(routine, at)`: agenda con `isExactNotification: false` explícito — nunca alarma exacta, documentado en `spec.md` (el recordatorio de una rutina no es crítico al minuto).
- Integrado en `CreateRoutinePage.tsx`: checkbox "Recordarme esta rutina" → al marcarla, ejecuta el flujo de 4 estados antes de agendar.

## 4. Selector de fotos — evidencia de rutina completada

- `routinePhotoPicker.ts`: `Capacitor.isPluginAvailable('Camera')` primero (evita fallo en Web/dev sin el plugin nativo real); si no está disponible, el botón "Adjuntar foto" ni siquiera se muestra (degradación, no error).
- Usa `Camera.chooseFromGallery({ quality: 70 })` — el Photo Picker del sistema, **sin ningún permiso de galería declarado** (ver spec.md).
- Cadena de propósito iOS (`NSPhotoLibraryUsageDescription`): _"Pasitos Mágicos necesita acceder a tus fotos para que puedas elegir una imagen ya guardada y adjuntarla como evidencia de una rutina completada. La app nunca sube ni comparte esta foto con nadie más."_ — específica del flujo real, no genérica.

## 5. Rationale (pre-permiso) — nunca genérico

`permissionCopy.ts` centraliza los textos, uno por capacidad, redactados sobre el caso de uso real:

- Notificaciones: _"Pasitos Mágicos puede avisarte cuando sea hora de una rutina pendiente, para que no se te olvide. Puedes desactivarlo cuando quieras desde esta misma pantalla."_
- (Fotos no necesita rationale propio porque el selector del sistema no dispara un permiso de la app — ver §4.)

## 6. Matriz de degradación

| Situación | Qué ve la persona usuaria |
|---|---|
| Notificaciones: `prompt`/`prompt-with-rationale` | Explicación breve + diálogo del sistema. Si acepta → confirmación "Te avisaremos". Si cancela → la rutina se crea igual, sin recordatorio, sin error. |
| Notificaciones: `denied` (permanente) | Banner: "No podemos recordarte esta rutina porque los recordatorios están desactivados." + botón "Abrir ajustes" (`capacitor-native-settings`, pantalla de notificaciones de la app). |
| Notificaciones: permiso concedido pero el usuario apagó las notificaciones del sistema después | `LocalNotifications.areEnabled()` se comprueba antes de cada agendado; si es `false`, mismo banner que la denegación permanente (misma experiencia para la persona usuaria, sin distinguir la causa técnica). |
| Selector de fotos: plugin no disponible (Web/dev) | El botón "Adjuntar foto" no se muestra — la pantalla de rutina funciona igual sin esa opción. |
| Selector de fotos: usuario cancela el picker | No pasa nada — la rutina sigue como estaba, sin foto. |
| Sin conexión al crear/editar (feature `010`) | Ya resuelto por el outbox — la rutina se guarda localmente y se sincroniza sola. |
| Cualquier llamada nativa lanza una excepción inesperada | Capturada con `try/catch` en cada wrapper de `services/device/*` — nunca se propaga sin manejar; el peor caso es "no se pudo activar el recordatorio/adjuntar foto", nunca un cierre de la app. |

## 7. Nivel de API objetivo

`android/variables.gradle`: `compileSdkVersion`/`targetSdkVersion = 36` (Android 16), publicado y vigente a la fecha de esta sesión (2026-09-19) — cumple el requisito de Google Play de objetivo dentro del año del último nivel de API mayor. Sin cambios necesarios.

## 8. Manifiesto de privacidad (iOS)

`@capacitor/camera` y `@capacitor/local-notifications` (ambos mantenidos por `ionic-team`) publican su propio `PrivacyInfo.xcprivacy` dentro del `.xcframework`/CocoaPod desde que Apple lo exige para el envío a App Store — se verifica su presencia tras `npx cap sync ios` revisando `ios/App/Pods/` (o el `Package.resolved` de SPM) antes de un build de distribución real.

## 9. Verificación

Mantenimiento 2026-09-20: solicitar notificaciones en el cambio del checkbox, bloquear interacción concurrente mientras se resuelve y dejar la comprobación final al agendado existente. Resolver el rationale desde onDidDismiss con rol confirm para evitar abrir un permiso nativo mientras se cierra el overlay. Añadir regresiones del momento de solicitud y de la cancelación. Compilar, sincronizar e instalar el APK actualizado sin limpiar los datos del emulador.

`yarn typecheck && yarn lint && yarn test` + prueba unitaria del hook `usePermissionFlow` cubriendo los 4 estados. La prueba en **dispositivo físico** de los 5 casos (concedido, denegado, denegado permanente, revocado durante el uso, capacidad ausente) queda pendiente por falta de hardware en esta sesión — se documenta como tarea abierta en el roadmap, igual que la validación de la feature `010`.
