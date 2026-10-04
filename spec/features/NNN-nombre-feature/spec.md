# NNN · <Nombre de la feature>

**Estado:** <propuesta | en curso | implementado ✅>

## Qué hace

<Descripción clara y breve desde el punto de vista del usuario: qué podrá hacer o ver. Sin detalles de implementación (eso va en `plan.md`).>

## Por qué

<Qué problema resuelve o qué valor aporta. Por qué merece la pena hacerla ahora.>

## Contrato de API consumido

_Verificado leyendo `canchago` directamente (o citando la entrada correspondiente en `../../constitution/api-integration.md`). Nunca inventado._

- `<MÉTODO> <ruta>` — permiso requerido: `<código>` — request/response reales.
- Si falta un endpoint o difiere del documentado: registrar la necesidad en `api-integration.md` antes de continuar, no implementar sobre un supuesto.

## Criterios de aceptación

_Condiciones verificables, redactadas para comprobarse con un sí/no. Marca `[x]` al cumplirse._

- [ ] <Comportamiento observable y comprobable.>
- [ ] <Caso límite o de error contemplado (offline, 401, 403, validación).>
- [ ] <Requisito de calidad: responsive, accesibilidad, dark mode, doble-envío, etc. si aplica.>

### Contratos y tipos (obligatorio)

- [ ] Los tipos TypeScript de request/response en `src/types/api/<módulo>.ts` reflejan exactamente el contrato real (sin `any`).
- [ ] Si el contrato consumido es nuevo o cambió, `../../constitution/api-integration.md` está actualizado en el mismo commit.

## Fuera de alcance

_Lo que esta feature NO incluye. Si algo se difiere, enlaza a dónde (roadmap/backlog)._

- <Cosa relacionada que se hará en otra feature o no se hará.>
