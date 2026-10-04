# Registro de uso de herramientas de IA

## Corrección de cuadros de permisos — 2026-09-20

Se inspeccionaron hooks, plugins, manifiesto y permisos efectivos con ADB. CAMERA y POST_NOTIFICATIONS estaban concedidos, por lo que Android omitía los cuadros. Se adelantó la solicitud de notificaciones al checkbox y se esperó el cierre del rationale antes de solicitar ambos permisos. Se agregaron regresiones, se ejecutaron lint/typecheck/tests/build/cap:sync/assembleDebug y se instaló el APK conservando datos. Se verificaron los dos cuadros reales invocando los plugins desde el WebView por CDP, sin iniciar sesión ni capturar fotos. Los permisos quedaron pendientes para la siguiente interacción del usuario. Capturas y alcance: `permission-prompts.md`.

Este documento cumple el requisito académico de trazabilidad de IA: herramienta usada, consultas realizadas, resultados utilizados, modificaciones aplicadas y verificaciones técnicas, con énfasis en decisiones con implicaciones de seguridad. Se agrega una sección nueva por sesión/feature, nunca se sobrescribe una anterior.

## Sesión — feature 010 (cliente HTTP, datos offline, chatbot)

### Herramienta

**GitHub Copilot** (agente de edición de código en VS Code), modelo **Claude Sonnet 4.5**.

### Consultas realizadas (resumen de la sesión)

1. Petición del usuario: endurecer el cliente HTTP existente (`services/api/apiClient.ts`) con renovación de sesión ante `401`, interceptor de log en desarrollo, reintentos idempotentes, cancelación de peticiones, separación remoto/local/repositorio con cola de salida offline, modelos con schema Zod, HTTPS obligatorio en producción y un chatbot funcional — todo sobre una app Ionic/React/Capacitor ya existente con autenticación real (Keycloak + Bearer nativo) y storage cifrado (`@aparajita/capacitor-secure-storage`).
2. Exploración previa obligatoria por constitución del repositorio (`AGENTS.md`): lectura de `spec/constitution/{mission,tech-stack,api-integration,roadmap}.md`, `services/api/`, `services/storage/`, `services/auth/`, `types/api/`, `features/routines/` para no inventar contratos ni duplicar convenciones.

### Resultados de la exploración utilizados

- Confirmado el contrato real de `POST /api/auth/refresh` (`api-integration.md` §2): responde `204` sin cuerpo — pensado para el flujo cookie/web, no para Bearer/nativo.
- Confirmado que no existía separación remoto/local/repositorio ni cola de salida (outbox) antes de esta feature — se construyeron desde cero sin asumir un backend de sincronización que no existe.
- Confirmado que ninguna pantalla llamaba a `apiClient` directamente (ya cumplía la regla de capas de `tech-stack.md` §2) — se preservó ese patrón haciendo que los hooks pasen a depender del nuevo repositorio en vez del endpoint remoto directo.

### Modificaciones aplicadas

- `src/services/api/apiClient.ts`: `validateStatus` explícito, interceptor único de request (correlación + Bearer + log dev), dos interceptors de response ordenados (log → renovación/errores), coalescencia de renovaciones (`refreshCoordinator.ts`), bandera `_retry` anti-bucle, backoff solo en `GET`.
- `src/services/api/refreshCoordinator.ts` (nuevo).
- `src/services/api/endpoints/auth.ts`: `refreshSession` ahora modela una respuesta opcional/anulable.
- `src/services/api/endpoints/routines.ts`: soporte de `AbortSignal`.
- `src/types/api/routines.ts`, `src/types/api/auth.ts`: schemas Zod, nulabilidad explícita, comentarios `// divergencia:` por campo.
- `src/services/local/routinesLocalSource.ts`, `src/services/local/outboxQueue.ts`, `src/services/repositories/routinesRepository.ts` (nuevos).
- `src/hooks/useNetworkStatus.ts` (nuevo).
- `src/features/routines/hooks/useRoutines.ts`, `.../pages/CreateRoutinePage.tsx`, `.../pages/RoutineListPage.tsx`: migrados al repositorio, con `AbortSignal` y drenado del outbox al reconectar.
- `src/config/env.ts`, `src/main.tsx`: `assertSecureProductionConfig` (exige HTTPS en producción salvo hosts de depuración documentados).
- `.env.production`: comentario explícito sobre la excepción de HTTPS.
- `src/features/chatbot/**`: chatbot de ayuda local (sin red, sin claves).
- `spec/constitution/api-integration.md`: tabla de correspondencia servidor↔cliente + registro de la propuesta pendiente sobre `/auth/refresh`.
- `spec/constitution/roadmap.md`: entrada de la feature `010`.
- `spec/features/010-cliente-http-datos-chatbot/{spec,plan,tasks}.md` (SDD, creados antes de tocar código).

### Verificaciones técnicas efectuadas

- `yarn typecheck` — sin errores de tipos tras los cambios.
- `yarn lint` — sin violaciones nuevas.
- `yarn test` — suite completa, incluida la prueba dedicada `apiClient.refresh.test.ts` que **fuerza un `401` real contra un adapter de Axios simulado** y verifica: (a) la renovación se dispara una sola vez, (b) la petición original se reintenta automáticamente tras renovar, (c) no hay bucle cuando la renovación no resuelve el `401` (máximo un retry marcado con `_retry`).
- Revisión manual de que ningún archivo nuevo incrusta claves/secretos: el chatbot es 100% reglas locales; las URLs de `.env.*` no son secretas (son endpoints públicos del backend, documentado desde la feature `001`).

### Decisiones con implicaciones de seguridad (atención explícita)

1. **No se modificó el backend** para "arreglar" el contrato de `/auth/refresh` — se documentó la divergencia como propuesta pendiente en `api-integration.md`, respetando el límite duro de `AGENTS.md` §7 ("no modificar el backend sin instrucción explícita").
2. **HTTPS obligatorio en producción** con una única excepción documentada (hosts de emulador/simulador `10.0.2.2`/`localhost`/`127.0.0.1`), nunca un dominio real — `assertSecureProductionConfig()` lanza en vez de degradar silenciosamente.
3. El interceptor de log **nunca imprime el header `Authorization`** (redacción explícita) y solo corre con `import.meta.env.DEV === true` — no puede activarse por accidente en un build de producción.
4. El token renovado se sigue guardando exclusivamente en `@aparajita/capacitor-secure-storage` (storage cifrado de la Semana 12) — el chatbot y la cola de salida (outbox) nunca tocan ese storage ni leen tokens.
5. La cola de salida (`outboxQueue.ts`) persiste sobre `@capacitor/preferences`, reservado por convención (`tech-stack.md` §7) para datos **no sensibles** — solo contiene el payload de creación de una rutina (título, categoría, puntos), nunca credenciales ni tokens.

## Sesión — feature 011 (capacidades del dispositivo: permisos, degradación)

### Herramienta

**GitHub Copilot** (agente de edición de código en VS Code), modelo **Claude Sonnet 4.5**.

### Consultas realizadas (resumen de la sesión)

1. Petición del usuario: auditar qué capacidades del dispositivo aportan valor real (descartando las puramente vistosas), verificar plugins mantenidos antes de código nativo propio, declarar solo los permisos estrictamente necesarios en Android/iOS con cadenas de propósito específicas, solicitar cada permiso en el momento de uso con rationale previo, cubrir los 4 estados de permiso con reacción distinta, ofrecer salida a ajustes ante denegación permanente, usar el selector de fotos del sistema sin declarar permisos de galería, evitar alarmas exactas y ejecución periódica en segundo plano, y elaborar la matriz de degradación — todo sin bloquear la app.
2. Verificación de versiones y mantenimiento real de plugins **antes de instalar nada**: se consultó la ficha de npm de `@capacitor/local-notifications`, `@capacitor/camera` y `capacitor-native-settings` (mantenedor, fecha de última publicación, rango de compatibilidad declarado con Capacitor 8, permisos que cada uno solicita) para decidir cuáles adoptar y con qué método exacto (`chooseFromGallery`, no `takePhoto`/`getPhoto`).
3. Exploración previa obligatoria por constitución del repositorio (`AGENTS.md`): lectura de `AndroidManifest.xml`, `variables.gradle`, `Info.plist`, `capacitor.config.ts` y de la feature `010` (outbox, storage cifrado) para articular las capacidades nuevas con lo ya construido, sin duplicar convenciones.

### Resultados de la exploración utilizados

- `@capacitor/camera` (`ionic-team`, v8.2.4, publicado 18 días antes de esta sesión): `chooseFromGallery` usa el Photo Picker del sistema y **no requiere ningún permiso** en Android 13+ ni iOS — confirmado leyendo la sección "Android"/"iOS" de su documentación oficial antes de escribir código, evitando declarar `CAMERA`/`READ_MEDIA_IMAGES` innecesariamente.
- `@capacitor/local-notifications` (`ionic-team`, v8.3.1, publicado ~1 mes antes): expone `PermissionState` con exactamente los 4 valores que pide el enunciado (`prompt`/`prompt-with-rationale`/`granted`/`denied`) — se reutilizó ese modelo tal cual en vez de inventar uno propio.
- `capacitor-native-settings` (comunidad, v8.2.0, ~132k descargas/semana, colaborador reconocido del ecosistema Capacitor, actividad reciente en GitHub): único plugin adoptado sin alternativa oficial de Ionic para abrir los ajustes de la app — se limitó su uso exclusivamente a la pantalla de notificaciones de la app (`AndroidSettings.AppNotification`/`IOSSettings.AppNotification`), no a ajustes generales del sistema.
- `android/variables.gradle` ya tenía `compileSdkVersion`/`targetSdkVersion = 36` (vigente a la fecha de la sesión) — sin cambios necesarios de nivel de API objetivo.
- Confirmado (leyendo `pasitos-backend` vía `api-integration.md`) que no existe contrato de subida de archivos — la foto de evidencia se guarda solo localmente, nunca se intenta subir a un endpoint inventado.

### Modificaciones aplicadas

- `package.json`: `@capacitor/local-notifications@8.3.1`, `@capacitor/camera@8.2.4`, `capacitor-native-settings@8.2.0`.
- `android/app/src/main/AndroidManifest.xml`: agregado únicamente `POST_NOTIFICATIONS`.
- `ios/App/App/Info.plist`: agregado únicamente `NSPhotoLibraryUsageDescription` con cadena de propósito específica del flujo real (evidencia de rutina).
- `capacitor.config.ts`: bloque `plugins.LocalNotifications` (color de icono, sin `smallIcon` inventado).
- `src/services/device/{permissionCopy,notificationPermission,permissionFlow,routineReminders,routinePhotoPicker}.ts` (nuevos).
- `src/services/local/routineEvidencePhotos.ts` (nuevo, cache local, nunca se sube al backend).
- `src/hooks/useNotificationReminderPermission.ts` (nuevo, integra el flujo genérico con `IonAlert` + `capacitor-native-settings`).
- `src/features/routines/pages/CreateRoutinePage.tsx`: checkbox opt-in "Recordarme esta rutina" con flujo de permiso completo.
- `src/features/routines/pages/RoutineDetailPage.tsx`: botón opt-in "Adjuntar foto de evidencia" con selector del sistema.
- `spec/constitution/roadmap.md`: entrada de la feature `011`.
- `spec/features/011-capacidades-dispositivo/{spec,plan,tasks}.md` (SDD, con la tabla de auditoría de capacidades y la evaluación de plugins, creados antes de tocar código).

### Verificaciones técnicas efectuadas

- `yarn typecheck` — sin errores de tipos (incluida la corrección de `PermissionState`, que se importa de `@capacitor/core`, no de `@capacitor/local-notifications`, detectada por el propio compilador).
- `yarn lint` — sin violaciones nuevas.
- `yarn test` — suite completa, incluida `permissionFlow.test.ts`, que cubre explícitamente los 4 estados de permiso (granted sin re-preguntar, denied permanente sin re-preguntar, prompt con rationale inicial, prompt-with-rationale con rationale insistente, cancelación del rationale sin disparar el diálogo nativo).
- `yarn build` y `yarn cap:sync` — confirmado que los 9 plugins de Capacitor (incluidos los 3 nuevos) se registran correctamente para Android e iOS sin errores de sync.
- Revisión manual de `AndroidManifest.xml`/`Info.plist` línea por línea para confirmar que no se coló ningún permiso no solicitado explícitamente (`CAMERA`, `ACCESS_FINE_LOCATION`, `SCHEDULE_EXACT_ALARM`, `READ_MEDIA_IMAGES` — ninguno presente).

### Decisiones con implicaciones de seguridad y privacidad (atención explícita)

1. **Ubicación descartada explícitamente** — no se agregó ningún plugin de geolocalización; documentado en `spec.md` como capacidad sin valor real para el dominio (rutinas no geolocalizadas), evitando el permiso más sensible de la plataforma sin necesidad.
2. **Selector de galería sin permisos**: se eligió deliberadamente `chooseFromGallery` (Photo Picker del sistema) en vez de `getPhoto`/APIs que requieren `READ_MEDIA_IMAGES` — la app nunca obtiene acceso de lectura general a la galería del usuario, solo al archivo puntual que la persona elige.
3. **Sin alarmas exactas**: no se declaró `SCHEDULE_EXACT_ALARM` ni `USE_EXACT_ALARM` — el recordatorio de rutina es aproximado a propósito, evitando un permiso de alto escrutinio en las tiendas de aplicaciones para un caso de uso que no lo justifica.
4. **Cadenas de propósito no genéricas**: la cadena de `NSPhotoLibraryUsageDescription` describe el flujo real ("evidencia de una rutina completada") y aclara explícitamente que la foto no se sube ni se comparte — evita el rechazo de revisión de Apple por cadenas vagas y fija una expectativa de privacidad verificable en el propio texto.
5. **Denegación permanente nunca reintenta el diálogo nativo** — `permissionFlow.ts` solo llama a `requestPermissions()` cuando el estado es `prompt`/`prompt-with-rationale`; con `denied` se ofrece exclusivamente el atajo a ajustes, evitando un patrón de "nagging" que las políticas de las tiendas penalizan.
6. **Evidencia fotográfica nunca sale del dispositivo**: `routineEvidencePhotos.ts` guarda solo la referencia local (`webPath`) en `@capacitor/preferences`; no existe ningún endpoint de subida invocado ni inventado, respetando el límite duro de `AGENTS.md` §7 de no fabricar contratos de backend.

### Correcciones de auditoría posteriores

- Se inspeccionó el manifiesto Android fusionado por Gradle y se eliminó con `tools:node="remove"` el `SCHEDULE_EXACT_ALARM` heredado de `@capacitor/local-notifications`; la etiqueta de permiso efectiva quedó ausente.
- Se añadió `ios/App/App/PrivacyInfo.xcprivacy` con seguimiento desactivado, cero datos recopilados y cero APIs de acceso declaradas por la app.
- Se documentó en `docs/device-capabilities-audit.md` la matriz de degradación, los permisos operativos aportados por plugins, el nivel de API 36 y la limitación de verificación de manifiestos de dependencias transitorias.
- Se incorporó captura opcional de evidencia con cámara mediante `Camera.takePhoto`, con rationale previo, acceso a ajustes tras denegación permanente, permiso Android `CAMERA` y cadena iOS `NSCameraUsageDescription`; la galería continúa usando Photo Picker sin permiso de galería.
