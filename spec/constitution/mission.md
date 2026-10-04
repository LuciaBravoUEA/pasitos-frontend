# Misión

_Proveer la experiencia móvil oficial de Pasitos Mágicos: una aplicación Ionic + React + TypeScript, clara, segura y accesible que acompaña las rutinas de niños con TDAH mediante tareas pequeñas y refuerzo positivo._

## Qué construimos

Construimos el cliente móvil de Pasitos Mágicos. Las rutinas, tareas y cumplimientos se guardan en PostgreSQL mediante el backend local verificado. El inicio y el seguimiento comparten progreso remoto; fotos y recordatorios permanecen locales.

1. **Rutinas motivadoras** — Tareas y hábitos diarios se presentan de forma visible, concreta y amable, con progreso, estrellas y refuerzo positivo.
2. **Acompañamiento compartido** — Padres y docentes reciben un resumen sencillo del día para decidir el siguiente paso de apoyo.
3. **Base extensible y segura** — Arquitectura modular por feature, con persistencia integrada mediante contratos aprobados, sin convertir la app en un monolito de pantallas acopladas.

## Para quién

- **Niños con TDAH:** necesitan una secuencia diaria predecible, sencilla y estimulante.
- **Padres y docentes:** necesitan observar el avance y acompañar las actividades pendientes sin una herramienta compleja.
- **El propio equipo de desarrollo:** se beneficia de una capa de API centralizada, tipada y trazable cuando se incorporen contratos de persistencia.

## Principios

- **El backend es la fuente de verdad cuando hay datos remotos** — Ningún modelo, endpoint o regla de negocio se inventa en el frontend.
- **El Contrato es la Ley** — El frontend no consume un endpoint sin haber verificado su contrato real y documentado su tipo.
- **Modularidad por feature** — Cada dominio (autenticación, rutinas, reportes futuros) vive en su propio directorio bajo `src/features/`, desacoplado de los demás.
- **Seguridad por diseño, no por parche** — Sesión, tokens y datos sensibles se tratan con el mismo rigor que exige OWASP Mobile/API, desde el primer commit, no como revisión posterior.
- **Trazabilidad extremo a extremo** — Toda operación relevante debe poder rastrearse desde el usuario y la pantalla hasta el request HTTP y su resultado, correlacionando con los identificadores que exponga el backend.

## Qué NO es

- NO es un lugar para inventar persistencia, perfiles o reglas clínicas sin un contrato y una spec aprobados.
- NO es un proyecto con frontend web separado: es una sola base Ionic React que se empaqueta como app nativa con Capacitor.
- NO sustituye el acompañamiento profesional, familiar o docente.
