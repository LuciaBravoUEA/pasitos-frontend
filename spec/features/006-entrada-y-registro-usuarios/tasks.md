# 006 · Entrada nativa y registro de usuarios — Tareas

## Preparación

- [x] Inspeccionar implementación de `AppInput`, login y actividad Android.
- [x] Confirmar que el backend actual no expone registro.
- [x] Obtener aprobación del contrato de registro.

## Entrada nativa

- [x] Reproducir el problema en el emulador: contraseña acepta teclado virtual y usuario sin tipo explícito no lo activa correctamente.
- [x] Implementar el redimensionamiento de contenido ante el teclado nativo.
- [x] Validar escritura con teclado físico y virtual en el emulador.

## Registro

- [x] Implementar el endpoint backend local de desarrollo.
- [x] Implementar tipos, validación Zod y formulario móvil.
- [x] Ejecutar la suite existente de pruebas.

## Cierre

### Corrección del teclado (2026-09-20)

- [x] Apertura explícita del teclado Android al tocar AppInput editable y redimensionamiento.
- [x] Desactivar escritura a mano del emulador y documentar recuperación en README.
- [x] APK instalado: teclado QWERTY, escritura por ADB y tecla virtual, reapertura tras Atrás.
- [x] Lint, typecheck, 56 tests, build, cap:sync y assembleDebug satisfactorios.

- [x] Ejecutar lint, typecheck, test, build y `cap:sync`.
- [x] Actualizar el roadmap y el contrato API.
