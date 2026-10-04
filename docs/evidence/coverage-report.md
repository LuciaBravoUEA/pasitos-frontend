# Cobertura — leída como mapa de lo que quedó sin mirar

`yarn test:coverage` (Vitest + `@vitest/coverage-v8`). Estado tras esta ronda: **32 archivos de prueba, 101 pruebas, todas en verde**. Cobertura global: **78.3% líneas / 80.88% ramas / 52.57% funciones**.

No se fijó un umbral (`thresholds`) que falle el build por debajo de un número — el objetivo de esta tarea es leer el reporte como un mapa de huecos, no perseguir un porcentaje. Regenerar con `yarn test:coverage` y abrir `coverage/index.html` para el detalle línea por línea.

## Huecos identificados y su decisión

| Área con cobertura baja | Por qué está así | Decisión |
| --- | --- | --- |
| `services/api/errorMapper.ts` (71% ramas antes de esta ronda) | Faltaban las ramas FORBIDDEN/NOT_FOUND/CONFLICT/INTERNAL_ERROR/METHOD_NOT_ALLOWED/default | **Corregido** — `errorMapper.branches.test.ts` (ítem obligatorio de esta tarea) |
| `features/routines/pages/RoutineDetailPage.tsx` (0% funciones) | Nunca tuvo un test de componente propio (solo se ejercita indirectamente) | Pendiente, backlog — no es lógica de decisión (validadores/errores), es una pantalla de detalle de solo lectura con menor riesgo que el listado/creación ya cubiertos |
| `features/student-tracking/**` (0% funciones) | Feature `012` reciente, sin pruebas de componente todavía | Pendiente, backlog de la feature `012` |
| `services/storage/preferences.ts` / `secureToken.ts` (0% funciones) | Son wrappers delgados sobre plugins de Capacitor (`@capacitor/preferences`, `@aparajita/capacitor-secure-storage`) que no existen en `jsdom` | Decisión ya tomada en `tech-stack.md`: se validan manualmente en emulador/dispositivo (ver evidencia de features `002`/`003`), no con mocks que simularían el plugin entero |
| `features/chatbot/components/ChatbotWidget.tsx` (16% funciones) | Solo la lógica de intenciones (`intents.ts`) tiene pruebas; el widget visual no | Pendiente, backlog — bajo riesgo (no toca red ni datos sensibles) |
| `hooks/useNotificationReminderPermission.ts`, `useLocalPhoto.ts` | Dependen de plugins nativos (notificaciones, cámara/galería) sin contraparte real en `jsdom` | Ya cubiertos indirectamente por `permissionFlow.test.ts` y las pruebas de `CreateRoutinePage`/`RoutineDetailPage`; el resto requiere dispositivo real (ver features `011`) |

## Rama nueva agregada tras leer el mapa

`errorMapper.branches.test.ts` cubre exactamente las ramas de `buildFromBackendCode` (FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR/METHOD_NOT_ALLOWED, default) que el reporte anterior marcaba como sin recorrer en `src/services/api/errorMapper.ts` (líneas 69,71,73,76,78).
