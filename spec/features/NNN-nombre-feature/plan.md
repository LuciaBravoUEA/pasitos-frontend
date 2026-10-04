# NNN · <Nombre de la feature> — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

<Estrategia general en pocas frases: qué aproximación se toma y por qué encaja con el stack y los principios del proyecto.>

## Implementación

_Pasos técnicos concretos, en orden. Indica los archivos/módulos que se tocan, respetando las capas de `tech-stack.md` §2 (types → validation → services/api → hooks de feature → componentes/páginas)._

1. <Paso — archivo/módulo afectado.>
2. <Paso — archivo/módulo afectado.>
3. <Paso — archivo/módulo afectado.>

N. **`src/types/api/<módulo>.ts`** — Tipos de request/response reflejando el contrato real verificado en `canchago`.

N+1. **`../../constitution/api-integration.md`** — Actualizar si el contrato es nuevo o distinto a lo ya registrado.

## Decisiones

_Elecciones de diseño relevantes y su justificación. Alternativas descartadas y por qué._

- **<Decisión>** — <por qué; qué se descartó>.

## Riesgos

_Qué puede salir mal o requerir cuidado, y cómo se mitiga._

- **<Riesgo>** — <mitigación>.
