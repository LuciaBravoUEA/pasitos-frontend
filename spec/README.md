# spec/ — Spec Driven Development (canchago-ionic)

> Este `spec/` es una copia adaptada de la plantilla SDD usada en el backend (`canchago/spec/`). Misma disciplina, mismo orden: primero se escribe la spec, luego el plan, luego las tareas, y solo entonces se toca el código. Nunca al revés.
>
> Diferencia respecto al backend: el frontend añade `constitution/api-integration.md`, un cuarto documento de constitución que no existe en `canchago` porque allí no hace falta — es donde este proyecto registra su lectura del contrato real de la API (`canchago`) y cualquier necesidad de cambio en el backend, sin modificarlo directamente.

## Estructura

```
spec/
├── constitution/                ← reglas estables del proyecto (cambian poco)
│   ├── mission.md               ← qué construimos y para quién
│   ├── tech-stack.md            ← tecnologías, convenciones y límites
│   ├── roadmap.md               ← orden de las features
│   └── api-integration.md       ← contratos reales consumidos de `canchago` + gaps/propuestas
└── features/                    ← una carpeta por feature
    └── NNN-nombre-feature/
        ├── spec.md              ← qué hace + criterios de aceptación
        ├── plan.md               ← cómo se implementa
        └── tasks.md              ← checklist de tareas
```

## Flujo para una feature nueva

1. Leer `constitution/tech-stack.md` y `constitution/api-integration.md` — ¿la tarea choca con alguna convención o requiere un contrato de API que no existe o difiere del real?
2. Crear `features/NNN-nombre-feature/` con el siguiente número libre.
3. Escribir `spec.md`: qué hace, por qué y criterios de aceptación medibles.
4. Escribir `plan.md`: enfoque técnico y decisiones, respetando `constitution/`.
5. Desglosar en `tasks.md` y marcar el progreso.
6. Implementar y validar (`yarn lint && yarn typecheck && yarn test && yarn build`, o lo que defina la constitución).
7. Actualizar `constitution/roadmap.md` (mover la feature a "Hecho").
8. Si la feature consumió o reveló un contrato de API, actualizar `constitution/api-integration.md`.

> La constitución manda: si una feature choca con `mission.md`, `tech-stack.md` o el contrato real de `canchago`, se replantea la feature — nunca se inventa un endpoint ni se modifica el backend sin instrucción explícita.
