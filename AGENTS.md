# Agent Constitution — pasitos-magicos

> **Leer esto antes de tocar cualquier archivo.** Este documento es la ley para agentes IA en este repositorio. Si algo aquí contradice tu conocimiento general de Ionic, React o Capacitor — **este documento gana**.

---

## 1. Contexto del proyecto

`pasitos-magicos` es el **cliente móvil oficial** (Ionic + React + TypeScript + Capacitor) de la plataforma de rutinas gamificadas para niños con TDAH. Consume exclusivamente los contratos reales del backend — **no reimplementa reglas de negocio, no inventa endpoints, no modifica el backend sin instrucción explícita del usuario**.

Lee `spec/constitution/mission.md` para qué construimos y para quién.
Lee `spec/constitution/tech-stack.md` para las reglas técnicas completas.
Lee `spec/constitution/api-integration.md` para el contrato real verificado y las propuestas pendientes de aprobación.
Lee `spec/constitution/roadmap.md` para qué está hecho y qué sigue.

El backend es **read-only** para este proyecto salvo instrucción explícita en contrario.

---

## 2. Spec-Driven Development (SDD) — la ley del proyecto

Este proyecto hereda la disciplina SDD: **primero la spec, luego el plan, luego el código. Nunca al revés.**

### Flujo obligatorio para cualquier tarea

```
PASO 1 — Entiende la constitución
  Lee spec/constitution/tech-stack.md       → ¿la tarea choca con alguna convención o límite duro?
  Lee spec/constitution/mission.md          → ¿encaja con lo que construimos?
  Lee spec/constitution/api-integration.md  → ¿el contrato que necesitas ya está documentado, o hay que verificarlo?

PASO 2 — Lee la spec de la feature
  Lee spec/features/<NNN>/spec.md   → qué debe hacer, criterios de aceptación medibles
  Lee spec/features/<NNN>/plan.md   → enfoque técnico y decisiones ya tomadas
  Lee spec/features/<NNN>/tasks.md  → qué queda pendiente, qué ya está hecho

PASO 3 — Si el contrato de API no está verificado, léelo directamente del backend
  No copies lo que te diga el usuario de memoria ni lo que documente `GET /api/docs` sin contrastarlo con el código —
  hay envelopes de respuesta documentados incorrectamente en el Swagger real (ver api-integration.md §7).

PASO 4 — Implementa respetando las capas (tech-stack.md §2)

PASO 5 — Verifica antes de declarar terminado
  yarn lint && yarn typecheck && yarn test && yarn build
  (y, si tocaste código nativo o de plataforma: yarn cap:sync)

PASO 6 — Actualiza el roadmap (OBLIGATORIO al completar una feature)
  En spec/constitution/roadmap.md:
  · Mueve la feature de "Siguiente 🔜" a "Hecho ✅" con su descripción final.
  · Si hay features en el backlog que ahora sean "Siguiente", promueve la adecuada.
  · Si la feature consumió o reveló un contrato nuevo, actualiza también api-integration.md.
  · Nunca declares una feature terminada sin haber actualizado el roadmap.
```

### Si no existe spec para la tarea — créala primero

Si el usuario pide algo sin spec, **no empieces a codear**. Crea la carpeta y los tres archivos usando la plantilla de `spec/features/NNN-nombre-feature/`:

```
spec/features/<NNN>-<nombre>/
├── spec.md     ← qué hace, por qué, contrato de API consumido, criterios de aceptación
├── plan.md     ← cómo se implementa técnicamente
└── tasks.md    ← checklist granular de tareas
```

Confirma con el usuario antes de implementar.

### Si la tarea necesita un endpoint que no existe o difiere del real

**No lo inventes.** Documenta la necesidad en `spec/constitution/api-integration.md` (endpoint requerido, request/response esperado, motivo, riesgo) y espera confirmación antes de sugerir cambios al backend. Nunca modifiques el backend sin instrucción explícita.

### La constitución manda

Si una feature choca con `mission.md`, `tech-stack.md` o el contrato real del backend, se replantea la feature — nunca la constitución, y nunca el backend. Si detectas un conflicto, señálalo explícitamente antes de continuar.

---

## 3. Stack — resumen (detalle completo en tech-stack.md)

Ionic React 8 + React 19 + TypeScript estricto · Capacitor 8 · React Router 5 (`IonReactRouter`) · TanStack Query 5 · Zustand · React Hook Form 7 + Zod 4 · Axios · Yarn.

**No existe backend propio aquí. No existe lógica de negocio — solo UI, orquestación de estado y consumo de contratos.**

**La app nunca se distribuye como web/PWA.** El navegador (`yarn dev`) es solo un atajo de desarrollo para iterar UI; el único target real es el WebView nativo, probado en Android Studio y Xcode (`yarn android` / `yarn ios`).

---

## 4. Capas y responsabilidades

Ver `spec/constitution/tech-stack.md` §2. Resumen: `pages/` orquesta, `features/<dominio>/hooks/` habla con `services/api/`, `services/api/` es la única puerta de salida HTTP. Viola estas fronteras y el PR se rechaza.

---

## 5. Convenciones de código

- **TypeScript estricto**: nunca `any`; usa `unknown` y valida antes de consumir.
- Funciones flecha por defecto.
- Nombrado: `camelCase` (vars/fns) · `PascalCase` (componentes/tipos) · `UPPER_SNAKE_CASE` (constantes globales) · `kebab-case.tsx` (archivos) · `kebab-case/` (directorios).
- `const` por defecto; `let` solo si hay reasignación; nunca `var`.
- `import type` para importaciones de solo tipo.
- Retornos tempranos para evitar anidamiento.
- Sin `as any` ni `// @ts-ignore` sin justificación documentada.
- Sin comentarios que expliquen _qué_ hace el código — solo el _por qué_ no obvio.
- 2 espacios de indentación, punto y coma, comillas simples.

---

## 6. Seguridad — reglas no negociables

- Nunca `localStorage`/`sessionStorage` para sesión, tokens o datos sensibles.
- Nunca leer o intentar leer la cookie `HttpOnly` de sesión desde JS.
- No registrar tokens, cookies ni contraseñas en logs.
- No exponer errores técnicos del backend al usuario final.
- No construir filtros/orderBy dinámicos sin lista blanca idéntica a la que acepta el endpoint real.
- Todo lo que va al bundle de la app es público — nunca un secreto de cliente OAuth confidencial.

Detalle completo en `spec/constitution/tech-stack.md` §11.

---

## 7. Límites duros — lo que nunca se hace

- No reimplementar reglas de negocio del backend "para ir más rápido".
- No inventar campos, endpoints o shapes de respuesta sin verificarlos leyendo el backend.
- No modificar el repositorio del backend sin instrucción explícita del usuario.
- No usar `localStorage`/`sessionStorage` para sesión o tokens.
- No hacer `fetch`/Axios disperso fuera de `services/api/`.
- No mezclar yarn con npm/pnpm.
- No usar `any` sin justificación documentada.
- No crear listados sin paginación si el endpoint la soporta.
- No crear formularios sin validación Zod, aunque el backend ya valide.
- No asumir un envelope `{data, meta}` uniforme sin revisar `api-integration.md`.

Lista completa en `spec/constitution/tech-stack.md` §12.

---

## 8. Comandos clave

```bash
yarn install && yarn dev
yarn lint && yarn typecheck && yarn test && yarn build
yarn cap:sync
yarn android   # build + abrir en Android Studio
yarn ios       # build + abrir en Xcode
```

---

## 9. Tests

- Unitarios junto al archivo: `services/auth/auth.service.test.ts`.
- Componentes críticos con Testing Library.
- Integración: `hook → servicio → API mock (msw) → estado UI`.
- E2E (Cypress): login, listar, crear, editar, eliminar, logout.
