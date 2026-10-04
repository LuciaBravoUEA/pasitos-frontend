# Inventario de riesgos — `pasitos-magicos`

Jerarquizado por **impacto × probabilidad**. La columna "Se prueba" documenta la decisión explícita (qué queda cubierto por pruebas automáticas y qué se deja como verificación manual, con el motivo).

## Crítico (rompe la app o compromete datos/seguridad)

| Riesgo | Consecuencia | Se prueba |
| --- | --- | --- |
| Token expirado no se renueva (401 en bucle o sesión perdida) | El usuario pierde su sesión sin aviso, o la app queda en un bucle de reintentos | Sí — `apiClient.refresh.test.ts` (renovación + anti-bucle + coalescencia) |
| Un token/contraseña se filtra en logs o en el monitoreo de fallos | Exposición de credenciales de un niño/tutor/docente | Sí — `logger.test.ts`, `monitoring.test.ts` |
| Un dato personal (email, nombre completo) se envía sin redactar al monitoreo | Incumplimiento de privacidad sobre datos de menores | Sí — `monitoring.test.ts` |
| Envío de una rutina con datos inválidos que el backend rechaza sin que el usuario lo entienda | Frustración, formularios que parecen "colgados" sin explicación | Sí — `CreateRoutinePage.validation.test.tsx` (incluye el bug real corregido de un campo no mapeado) |
| Pérdida de datos de una rutina creada sin conexión | El usuario cree que guardó una actividad y no se sincroniza nunca | Sí — `routinesRepository.test.ts` (outbox) — ya existente de la feature 010 |

## Alto (afecta a una parte importante de usuarios, pero no compromete seguridad)

| Riesgo | Consecuencia | Se prueba |
| --- | --- | --- |
| Pantalla principal de rutinas no distingue cargando/vacío/error | El usuario no sabe si debe esperar, reintentar o crear su primera rutina | Sí — `RoutineListPage.test.tsx` (los cuatro estados) |
| Timeout de red no se traduce a un mensaje entendible | El usuario ve un error técnico o la app parece congelada | Sí — `apiClient.contract.test.ts` |
| Reintento automático duplica una creación de rutina | Datos duplicados en el backend | Sí — ya cubierto: el backoff de `apiClient.ts` solo aplica a `GET`, nunca a `POST` (documentado y probado en la feature 010) |
| Fluidez pobre en dispositivos de gama baja (el público objetivo son escuelas con presupuesto limitado) | Abandono de la app, frustración en niños con TDAH (sensibles a fricción) | **No** con pruebas automáticas — requiere perfilado en dispositivo físico real, ver `performance-profiling-checklist.md` |

## Medio (degrada la experiencia sin bloquear el uso)

| Riesgo | Consecuencia | Se prueba |
| --- | --- | --- |
| Un error de servidor no traducido (código nuevo del backend) muestra un mensaje técnico | Confusión puntual, no bloquea el flujo | Sí — `errorMapper.branches.test.ts` cubre el `default` → `UnknownError` → mensaje genérico |
| Regresión visual en un componente reutilizable (`AppButton`, `AppCard`, `AppInput`) | Inconsistencia visual entre pantallas | **No** — el proyecto no usa pruebas de regresión visual todavía; se decide no introducirlas en esta ronda porque el sistema de diseño (`008-sistema-diseno-accesible`) ya tiene verificación de contraste automatizada y catálogo visual manual; agregar snapshots de imagen sin una herramienta ya configurada (ej. Chromatic/Percy, ninguna en `package.json`) sería sobre-ingeniería para el alcance actual |
| Chatbot de ayuda responde con una intención incorrecta | Respuesta poco útil, no rompe nada | Ya probado — `intents.test.ts` (feature 010), fuera de este alcance |

## Bajo (cosmético o de nicho)

| Riesgo | Consecuencia | Se prueba |
| --- | --- | --- |
| Formato de fecha/hora local varía entre dispositivos | Pequeña inconsistencia visual en "Última sincronización" | **No** — impacto mínimo, no vale la pena fijar el reloj del sistema en cada test |
| Racha semanal (`Home.tsx`) usa datos de demostración, no reales | Métrica no representa el progreso real | **No es un bug** — es una demo conocida y documentada (`Home.tsx` no está conectado al backend de rutinas todavía); no se prueba como si fuera lógica real |

## Fuera de alcance de las pruebas automáticas de este repositorio

- **Rendimiento en dispositivo físico real** (hilo UI vs. trazado, jank real): ningún entorno CI/agente tiene acceso a un teléfono físico. Se deja como checklist manual.
- **Disparo de un fallo real contra Sentry con DSN de producción**: requiere una cuenta real del usuario, no se puede simular sin credenciales reales sin comprometer el principio de "nunca generar/adivinar URLs o secretos".
- **Backend real** (`canchago`): es de solo lectura para este proyecto (AGENTS.md) — cualquier riesgo del lado del servidor se documenta pero no se corrige aquí.
