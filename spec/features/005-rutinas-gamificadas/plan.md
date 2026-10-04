# 005 · Plan de implementación

## Enfoque

Se reutiliza la base actual de Ionic React con sesión y rutas, y se adapta la identidad visual y la pantalla principal para convertirla en una app centrada en rutinas diarias, motivación y reforzamiento positivo.

## Implementación

1. Renombrar textos, branding e identidad visual de la app.
2. Rediseñar la home para mostrar rutinas diarias, progreso y recompensas.
3. Añadir un estado local de rutinas con tareas completadas, estrellas y una recompensa visual/auditiva al completar.
4. Derivar un reporte local para padres y docentes a partir de ese mismo estado, sin llamar ni modelar un endpoint inexistente.
5. Sustituir mensajes técnicos por un tono motivador, infantil y claro.
6. Validar con las pruebas relevantes y mantener la base funcional.

## Riesgos

- No romper la sesión y autenticación existentes.
- No introducir lógica compleja sin backend real.
- Mantener la app accesible y legible para niños y adultos.
