# 006 · Entrada nativa y registro de usuarios — Plan

## Diagnóstico de entrada

1. Reproducir el foco y escritura en el WebView del emulador.
2. Revisar si un overlay, el control de teclado de Capacitor o el manejo controlado de `IonInput` bloquea el foco.
3. Aplicar la corrección mínima dentro de `AppInput` o `LoginPage`, sin sustituir componentes Ionic por inputs HTML.
4. Validar manualmente con teclado virtual y físico.

## Registro

### Corrección de teclado Android (2026-09-20)

Conservar `IonInput`. Al tocar un campo editable, enfocar mediante `setFocus()` y solicitar el teclado con el plugin existente solo en Android; permitir reabrirlo tras cerrarlo con Atrás. Configurar `adjustResize` y `Keyboard.resizeOnFullScreen` para mantener accesible el formulario. Validar en el emulador, sin enviar credenciales, y ejecutar los checks del proyecto.

Tras la aprobación del contrato, agregar:

1. Tipos API y endpoint en `services/api/endpoints/auth.ts`.
2. Schema Zod y formulario con React Hook Form.
3. Página o estado de registro dentro de `features/auth/`.
4. Pruebas unitarias y de integración.

No se guardarán contraseñas, tokens ni datos sensibles fuera del almacenamiento seguro existente.
