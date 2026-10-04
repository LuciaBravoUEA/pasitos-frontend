# Autenticación tras reiniciar — 2026-09-20

## Hallazgos

- Los logs del backend mostraban HTTP 500 en login. El handler ocultaba la excepción original; no se pudo atribuir retrospectivamente a una causa exacta.
- La sesión dependía de un Set en memoria: reiniciar el servidor invalidaba todos los tokens.
- Cada intento de login reescribía una cuenta semilla y su contraseña.
- Docker tenía política de reinicio `no`; el script de arranque usaba modo adjunto.
- La caché `.next` compartida con Windows contenía archivos de tipos dañados.

## Cambios guardados

Backend autorizado por el usuario: se quitó la reescritura de cuentas desde login, se validan los tipos de entrada, se persisten hashes de tokens opacos en `user_sessions`, y se implementaron logout y refresh. Los errores de autenticación registran solamente operación, nombre y código del error. Docker usa `unless-stopped`, inicio desacoplado, generación de Prisma al arrancar y volumen aislado para `.next`.

No se migran tokens antiguos en memoria: el usuario debe iniciar sesión una vez después del cambio. Las sesiones nuevas mantienen vigencia de 24 horas.

## Evidencia

Prueba HTTP real con cuenta temporal generada por el propio script `pasitos-backend/scripts/auth-persistence-check.cjs`:

- Registro 201 y login 200; contraseña incorrecta 401; tipos de entrada inválidos 400.
- Hash de token presente en PostgreSQL.
- Misma sesión 200 después de `docker restart pasitos-backend`.
- Refresh 204; mismo token sigue válido.
- Logout 204; token revocado 401 tanto en session como refresh.
- Misma cuenta y contraseña permiten login después del reinicio.
- Token vencido e inventado rechazados con 401.
- Cuenta temporal y sesiones eliminadas al terminar.

Checks del cliente: lint, typecheck, 77 tests y build correctos. Se corrigió una referencia `.mock` sin tipar en un test existente de notificaciones usando `vi.mocked`.

Checks del backend: `next typegen`, `tsc --noEmit` y ESLint de `src/lib/auth` y `src/app/api/auth` correctos con la caché aislada.

No se validó el login interactivo de la cuenta personal del usuario: la revisión automática rechazó reutilizar credenciales embebidas del código. La prueba independiente empleó exclusivamente datos temporales propios, sin leer credenciales existentes.
