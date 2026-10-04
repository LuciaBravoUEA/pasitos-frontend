# Verificación de accesibilidad y adaptación

Dispositivo: Android Emulator `emulator-5554`, resolución física base 1080 × 2400.

## Resultados

- Contraste: 14/14 pares funcionales cumplen WCAG 2.2 AA. Evidencia en `contrast-wcag-2.2.md`.
- Ancho equivalente a 320 CSS px: contenido sin desbordamiento horizontal; el formulario continúa mediante desplazamiento vertical. Evidencia: `pm-login-width-320.png`.
- Ancho equivalente a 768 CSS px: layout en dos columnas sin superposición. Evidencia: `pm-login-width-768.png`.
- Fuente del sistema al 200 %: el texto aumenta, hace reflow y el contenido permanece accesible mediante scroll. Evidencia: `pm-login-font-200.png`. El emulador fue restaurado a 100 %.
- Áreas táctiles: el tema declara 44 × 44 CSS px como mínimo para `AppButton`, campos y controles del catálogo; Android renderiza el botón principal por encima del mínimo.
- Semántica: con TalkBack activo, el WebView expuso encabezados, campos editables, contraseña protegida, toggle “Show password” y botones con nombres. Evidencia: `pm-talkback.xml`. Se añadió `aria-label` explícito a cada `AppInput` después de detectar que la primera inspección no exponía el label en el nodo editable.
- TalkBack fue activado para extraer el árbol y desactivado al terminar. El recorrido auditivo humano por gestos queda pendiente, porque una automatización no puede confirmar qué entendió una persona al escucharlo.

## Recorrido manual pendiente (2 minutos)

1. Activa TalkBack en Ajustes → Accesibilidad → TalkBack.
2. Desliza a la derecha desde el título hasta usuario, contraseña, mostrar contraseña, iniciar sesión y crear cuenta.
3. Confirma que cada control se anuncia con nombre, función y estado, y que el foco sigue ese orden.
4. Desactiva TalkBack manteniendo ambos botones de volumen durante tres segundos.
5. Marca la tarea pendiente en `spec/features/008-sistema-diseno-accesible/tasks.md`.
