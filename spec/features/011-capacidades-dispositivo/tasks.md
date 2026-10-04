# Tareas — 011

## Cuadros de permisos (2026-09-20)

- [x] Solicitar notificaciones al activar la opción y esperar el cierre del rationale.
- [x] Checks, build y cap:sync; instalar APK actualizado sin borrar datos.
- [x] Comprobar cuadros nativos de cámara y notificaciones en el emulador mediante plugins reales del WebView; evidencia en docs/evidence/permission-prompts.md.

## Correcciones de la auditoría (2026-09-20)

- [ ] Unificar cámara/notificaciones, cuatro estados y cierres de alertas.
- [ ] Aislar fallos del recordatorio, mostrar resultado y ajustes sin duplicar creaciones.
- [ ] Base IndexedDB, migración de datos, fotos persistentes y recordatorio offline.
- [ ] Sincronización al abrir/reconectar/resume, autenticada y sin concurrencia.
- [ ] Privacidad iOS, textos específicos y dependencias mínimas.
- [ ] Regresiones, checks completos, APK y evidencia de limitaciones manuales.

- [x] Instalar `@capacitor/local-notifications@8.3.1`, `@capacitor/camera@8.2.4`, `capacitor-native-settings@8.2.0` (evaluados en `spec.md`).
- [x] `AndroidManifest.xml`: agregar únicamente `POST_NOTIFICATIONS`.
- [x] `Info.plist`: agregar únicamente `NSPhotoLibraryUsageDescription` con cadena de propósito específica.
- [x] `services/device/permissionCopy.ts`, `notificationPermission.ts`, `routineReminders.ts`, `routinePhotoPicker.ts`.
- [x] `hooks/usePermissionFlow.ts` con los 4 estados + integración con `capacitor-native-settings`.
- [x] Integrar recordatorio opt-in en `CreateRoutinePage.tsx`.
- [x] Integrar selector de foto opt-in en `RoutineDetailPage.tsx`.
- [x] `capacitor.config.ts`: configuración de canal por defecto de `LocalNotifications` si aplica.
- [x] Pruebas unitarias del flujo de 4 estados y de la matriz de degradación básica.
- [x] `docs/evidence/ai-usage-log.md` actualizado.
- [x] `spec/constitution/roadmap.md` actualizado.
- [x] Auditoría consolidada de capacidades, permisos, degradación, API objetivo y plugins en `docs/device-capabilities-audit.md`.
- [x] Eliminado del manifest final el permiso heredado `SCHEDULE_EXACT_ALARM`, porque los recordatorios son inexactos.
- [ ] Prueba manual en dispositivo físico de los 5 casos (concedido/denegado/denegado permanente/revocado en uso/capacidad ausente) — pendiente por falta de hardware.
