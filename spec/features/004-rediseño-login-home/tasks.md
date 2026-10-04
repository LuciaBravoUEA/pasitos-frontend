# 004 · Rediseño visual de login y home — Tareas

_Checklist accionable derivada del `plan.md`. Esta feature no se implementa hasta que la propuesta sea aprobada._

## Diseño base

- [x] Auditar visualmente login y `Home` actuales en Android/iOS, claro/oscuro y ancho de 320 px.
- [x] Definir tokens semánticos de color, superficie, borde, sombra, radio y espaciado en `src/theme/variables.css`.
- [x] Definir estados de foco, error, carga, vacío y movimiento reducido.
- [x] Crear `AuthShell` con marca, contenido centrado, safe areas y semántica accesible.

## Login

- [x] Aplicar el nuevo shell al login nativo sin cambiar `loginWithPassword`, secure storage ni invalidación de sesión.
- [x] Aplicar el mismo lenguaje visual al login web/dev sin reemplazar su redirect OAuth.
- [x] Ajustar `AppInput` para el nuevo estilo conservando labels, errores y compatibilidad con React Hook Form.
- [x] Ajustar `AppButton` para altura táctil, foco y carga accesible.
- [x] Implementar estilos adaptables del login en un archivo CSS acotado a la feature.
- [x] Verificar credenciales incorrectas, error general, validación local y doble envío.

## Home

- [x] Crear `ProfileSummary` con iniciales, nombre, correo, roles y estado sin roles.
- [x] Crear `HomeActionCard` para accesos reales y protegidos.
- [x] Rediseñar `Home.tsx` como panel sin cambiar el origen de datos ni la mutación de logout.
- [x] Mantener `RoleGuard` y `PermissionGuard` en toda sección condicionada.
- [x] Eliminar textos de diagnóstico visibles al usuario final.
- [x] Implementar rejilla y estilos adaptables del `Home` en CSS acotado a la pantalla.
- [x] Mantener logout visible, secundario y bloqueado mientras está pendiente.

## Pruebas y accesibilidad

- [x] Probar login nativo y web/dev en estados normal, foco, validación, carga y error.
- [x] Probar `Home` con sesión con roles, sin roles y con contenido protegido permitido/denegado.
- [x] Probar logout pendiente y resultado exitoso sin regresiones.
- [x] Verificar nombres accesibles, asociación de errores, orden de foco y áreas táctiles de 44 × 44 px.
- [x] Verificar contraste en claro/oscuro y comportamiento con `prefers-reduced-motion`.
- [x] Verificar 320 × 568, 390 × 844 y 768 × 1024 sin desbordamiento horizontal.

## Contratos y tipos (obligatorio)

- [x] Confirmar que `src/types/api/auth.ts` continúa reflejando el contrato real sin `any`.
- [x] Confirmar que no se agregaron endpoints ni llamadas HTTP.
- [x] Actualizar `../../constitution/api-integration.md` únicamente si se descubre una diferencia contractual real.

## Cierre

- [x] Validar todos los criterios de aceptación de `spec.md`.
- [x] Ejecutar `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [x] Ejecutar `yarn cap:sync` sin errores.
- [x] Validar un build Android y un build iOS.
- [x] Marcar la feature como implementada y moverla a “Hecho” en `../../constitution/roadmap.md`.

