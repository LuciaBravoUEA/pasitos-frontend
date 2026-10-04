# 013 · Calidad, observabilidad y lista de verificación de lanzamiento

## Qué

Trabajo académico que endurece la disciplina de pruebas y observabilidad de `pasitos-magicos` sin modificar el comportamiento ya validado de las features `001`–`012`: inventario y priorización de riesgos, pruebas unitarias sobre lógica de decisión, dobles de transporte HTTP, pruebas de componente para los cuatro estados de la pantalla principal de rutinas, cobertura leída como mapa (no como meta), un bug real reproducido con una prueba antes de corregirlo, monitoreo de fallos (Sentry, capa gratuita) con filtrado de PII, integración continua en GitHub Actions y la lista de verificación previa a la publicación.

## Por qué

Requisito explícito del usuario (checklist completo de prácticas de calidad/observabilidad para cierre de curso). Se documenta como feature nueva siguiendo el flujo SDD del proyecto (AGENTS.md §2) para que el trabajo quede trazable y no se pierda al cerrar la sesión de edición.

## Alcance y una divergencia documentada (no se inventó ningún endpoint)

El enunciado pide una única prueba E2E sobre "login → ver rutinas del día → completar una rutina". El backend integrado **no expone hoy un endpoint para completar una rutina** (`services/api/endpoints/routines.ts` solo tiene `listRoutines`/`getRoutine`/`createRoutine` — ver `spec/constitution/api-integration.md`). El único "completar" existente en la app es una demo local en `pages/Home.tsx` con datos hardcodeados, sin persistencia real, y no forma parte del dominio `rutinas` conectado al backend.

**Decisión explícita del usuario (2026-09-26): no se agrega el E2E en esta ronda.** Se implementará únicamente si el profesor/rúbrica lo exige de forma explícita; hasta entonces queda fuera del alcance para no gastar esfuerzo en algo que podría no pedirse tal cual, y para no fijar de antemano un recorrido ("completar rutina") que requeriría inventar un contrato de backend no aprobado. Se deja documentada aquí la propuesta de exponer `PATCH /api/rutinas/:id` (`{completed: boolean}`) para cuando se confirme el requisito.

## Contrato de API consumido

Ninguno nuevo. Se reutiliza el contrato ya verificado de la feature `010` (`/rutinas`, `/rutinas/:id`, `/auth/session`, `/auth/refresh`).

## Criterios de aceptación

- [x] Inventario de riesgos priorizado con decisión escrita de qué se prueba y qué no — `docs/evidence/risk-inventory.md`.
- [x] Pruebas unitarias sobre lógica de decisión (traducción de errores `errorMapper.ts`, validadores Zod, redacción de logs) — corren sin red, sin emulador, y Vitest no impone orden entre archivos.
- [x] Pruebas de componente para los cuatro estados (cargando/datos/vacía/error) de la pantalla principal de rutinas (`RoutineListPage.test.tsx`), con un doble del repositorio de la Semana 13 (`routinesRepository`) como origen de datos falso.
- [x] El formulario de creación de rutina impide el envío inválido y asocia errores de servidor a sus campos, incluido el caso antes roto de un campo no mapeado (`CreateRoutinePage.validation.test.tsx`).
- [x] Doble del transporte HTTP para 200, 401 con renovación (ya existente en `apiClient.refresh.test.ts`), 422 y tiempo de espera agotado (`apiClient.contract.test.ts`).
- [ ] Una sola prueba E2E sobre el recorrido crítico — **retirada a pedido del usuario**; se agrega solo si el profesor la exige explícitamente (ver sección de arriba).
- [x] Cobertura ejecutada (`yarn test:coverage`) y leída como mapa de huecos — `docs/evidence/coverage-report.md`.
- [x] Una prueba nueva sobre una rama que la cobertura reveló sin recorrer (`errorMapper.branches.test.ts`).
- [x] Un bug real reproducido primero con una prueba y corregido después (`CreateRoutinePage.tsx` — error de validación de servidor en un campo no mapeado se perdía en silencio).
- [x] Ninguna prueba de la batería está desactivada (`.skip`/`xit`/`xdescribe`) — verificado por búsqueda en todo `src/`.
- [x] Registro estructurado con niveles ya existente (`services/telemetry/logger.ts`) no incluye tokens/contraseñas/PII sin redactar — verificado con prueba ya existente (`logger.test.ts`) y nueva (`monitoring.test.ts`).
- [x] Monitoreo de fallos (Sentry, capa gratuita) instrumentado, filtrando el encabezado `Authorization` y datos personales, usando el id interno de sesión (nunca correo/documento) — `services/telemetry/monitoring.ts`.
- [x] Integración continua: `\.github/workflows/ci.yml` ejecuta lint + typecheck + test con cobertura + build en cada push/PR.
- [ ] Rendimiento medido en modo de perfilado sobre dispositivo físico, identificando hilo UI vs. trazado, corrigiendo un problema de fluidez y remidiendo — **requiere hardware físico, no ejecutable por el agente**; guía dejada en `docs/evidence/performance-profiling-checklist.md` para que el usuario la complete y registre el resultado.
- [ ] Provocar un fallo de prueba real contra el proyecto de Sentry del usuario y confirmar que el informe llega con traza y versión — **requiere una cuenta/DSN real de Sentry**, no disponible en esta sesión; procedimiento documentado en `docs/evidence/pre-release-checklist.md`.
- [x] Lista de verificación previa a la publicación recorrida con el resultado de cada punto — `docs/evidence/pre-release-checklist.md`.
