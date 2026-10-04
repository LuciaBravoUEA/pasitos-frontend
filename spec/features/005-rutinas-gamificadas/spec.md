# 005 · Rutinas gamificadas para TDAH

**Estado:** en implementación

## Qué hace

Adapta la app a la marca “Pasitos Mágicos” para apoyar a niños con TDAH a mantener rutinas diarias, reforzar la concentración y regular emociones a través de tareas pequeñas, visibles y motivadoras. La pantalla principal presenta rutinas diarias con estado, recompensas visuales y seguimiento simple para padres y docentes.

## Por qué

Muchos niños con TDAH necesitan estructura, refuerzo positivo y una visión clara del progreso. La app debe convertir las tareas del día en una experiencia motivadora, con metas pequeñas que aumenten la autoestima y hagan más fácil acompañar la rutina diaria.

## Objetivos

- Renombrar la aplicación como Pasitos Mágicos y centrarse en la experiencia infantil y familiar.
- Mostrar rutinas diarias representadas como tareas concretas: leer, ordenar útiles, ejercicios de concentración y otras actividades simples.
- Incorporar gamificación con estrellas, racha y porcentaje de finalización.
- Mantener la experiencia simple, amable y accesible para padres, docentes y niños.
- Preservar la base técnica del proyecto Ionic + React + TypeScript.

## Historias de usuario

- Como niño, quiero completar tareas pequeñas y ver recompensas visuales para sentir motivación.
- Como padre, quiero ver el progreso del día para acompañar mejor la rutina.
- Como docente, quiero identificar qué tareas se realizaron para apoyar la estrategia educativa.
- Como usuario, quiero una app clara y amable, sin carga técnica ni mensajes complejos.

## Funcionalidad principal

La aplicación contará con un sistema de rutinas gamificadas, donde los niños podrán registrar tareas escolares y hábitos diarios (como leer, ordenar sus útiles o practicar ejercicios de concentración). Cada actividad completada otorgará recompensas visuales y auditivas, reforzando la motivación. Los padres y docentes podrán monitorear el progreso mediante reportes simples, lo que facilitará la comunicación y el acompañamiento. Esta funcionalidad ayudará a transformar las tareas en experiencias positivas, fomentando la constancia y el desarrollo de habilidades socioemocionales.

## Requisitos P0

- Pantalla principal con branding Pasitos Mágicos.
- Listado de rutinas del día con estados completados/pendientes.
- Indicadores de progreso: número de tareas completadas, estrellas ganadas y porcentaje de avance.
- Recompensa visual y auditiva al completar una tarea.
- Símbolos o iconos amigables y accesibles para niños.
- Sección de “racha de la semana” y progreso del día.
- Reporte local para padres y docentes con avance, siguiente actividad pendiente y estrellas obtenidas.
- Mantenimiento del flujo de sesión, logout y estructura general del proyecto.

## Criterios de aceptación

- [x] La app muestra el nombre Pasitos Mágicos en la pantalla principal y el login.
- [x] Se visualiza una lista de tareas con estado por actividad.
- [x] El usuario puede marcar tareas como completadas.
- [x] La pantalla refleja progreso con estrellas, porcentaje y racha.
- [x] Cada tarea marcada muestra una recompensa visual y reproduce un tono breve cuando el dispositivo lo permite.
- [x] Padres y docentes ven un reporte local con avance, actividad pendiente y refuerzo positivo.
- [x] El diseño es colorido, amigable y claro para niños.
- [x] Se conserva la lógica de autenticación actual.
- [x] La app sigue funcionando sin romper las pruebas existentes.

## Fuera de alcance

- Integración con backend real de tareas.
- Autenticación de distintos perfiles complejos.
- Gestión avanzada de docentes, padres o reportes históricos.
