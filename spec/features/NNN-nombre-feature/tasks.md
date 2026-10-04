# NNN · <Nombre de la feature> — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [ ] <Tarea concreta de implementación.>
- [ ] <Tarea concreta de implementación.>
- [ ] <Tarea de pruebas / validación.>

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [ ] Definir/actualizar `src/types/api/<módulo>.ts` a partir del contrato real verificado en `canchago`.
- [ ] Actualizar `../../constitution/api-integration.md` si el contrato es nuevo o difiere de lo ya registrado.
- [ ] Verificar manualmente contra el backend real (o su Swagger en `/api/docs`, con cautela — hay envelopes documentados incorrectamente) que la respuesta coincide con lo tipado.

## Cierre

- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [ ] Si se tocó código nativo/plugins: `yarn cap:sync` sin errores.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

_Opcional. Borra esta sección si no aplica._

- [ ] <Acción recurrente.>
