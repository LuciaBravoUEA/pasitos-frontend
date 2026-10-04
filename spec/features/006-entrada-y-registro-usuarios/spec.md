# 006 · Entrada nativa y registro de usuarios

**Estado:** en implementación

## Objetivo

Permitir que los campos de usuario y contraseña del login se puedan enfocar y escribir con el teclado del emulador Android, y ofrecer un flujo para crear cuentas nuevas desde la app.

## Alcance

1. Corregir y validar el foco, escritura y apertura del teclado en los `IonInput` del login nativo.
2. Agregar acceso visible desde login hacia un formulario de registro.
3. Validar el formulario con React Hook Form y Zod: nombre, usuario, correo y contraseña.
4. Crear la cuenta solo mediante un contrato real del backend y mostrar errores comprensibles.

## Contrato de API

El backend actual solo expone `POST /api/auth/mobile/login`; no tiene un endpoint de registro. Para implementar el punto 4 se requiere aprobar y verificar:

`POST /api/auth/mobile/register`

Request esperado:

```json
{ "name": "...", "username": "...", "email": "...", "password": "..." }
```

Respuesta esperada:

```json
{ "data": { "sessionToken": "...", "expiresAt": "..." } }
```

El backend persistirá las cuentas en PostgreSQL mediante Prisma. Las contraseñas se almacenarán exclusivamente como hashes `scrypt` con sal aleatoria; nunca como texto plano. La autenticación académica local seguirá emitiendo el token Bearer existente.

## Criterios de aceptación

- [ ] En Android, tocar cada campo enfoca el input y permite escribir con teclado físico o virtual.
- [ ] El teclado no tapa el campo activo; la pantalla permite desplazarse.
- [ ] El formulario de registro muestra validaciones en español y no envía contraseñas a logs.
- [x] El contrato de registro fue aprobado explícitamente por el usuario.
- [ ] Las cuentas creadas sobreviven al reinicio del backend y pueden volver a iniciar sesión.
- [ ] Login, lint, typecheck, tests, build y sincronización Capacitor continúan sin errores.
