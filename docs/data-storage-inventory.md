# Inventario y almacenamiento local

Actualizado para 018 · Modo sin conexión (2026-10-04).

## Datos manejados

| Clase | Datos | Naturaleza | Almacenamiento | Finalidad | Retención |
| --- | --- | --- | --- | --- | --- |
| Autenticación | Token de sesión Bearer | Sensible | `@aparajita/capacitor-secure-storage` (Keystore/Keychain) | Mantener la sesión nativa | Hasta logout, revocación o expiración |
| Identidad | Identidad/roles/permisos validados, credencial vinculada, expiración y fecha de validación | Sensible | Snapshot en SecureStorage | Reapertura offline de la cuenta propia | Mínimo entre expiración real y 24 h desde validación; limpieza al salir/401 |
| Clave de cifrado | Clave AES de 256 bits aleatoria | Secreto local | SecureStorage | Cifrar registros de IndexedDB | Nunca junto a la base de datos |
| Rutinas | Respuestas reales de listas/detalles y metadatos de paginación | Personal | IndexedDB con valores AES-GCM en nativo | Consulta offline | TTL lógico de 24 h; limpieza física al salir/401 |
| Seguimiento/historial propios | Progreso por fecha y páginas consultadas con metadatos reales | Educativo sensible | IndexedDB con valores AES-GCM en nativo | Consulta offline sin recalcular progreso | TTL lógico de 24 h; limpieza física al salir/401 |
| Operaciones pendientes | Creación, UUID local, intentos, incertidumbre e intención de aviso | Personal | IndexedDB con valores AES-GCM en nativo | Continuidad offline | Hasta sincronización o logout; 5 fallos suspenden reintento automático sin descartar |
| Borradores/fotos/avisos | Borrador, referencia de foto e intenciones de recordatorio | Personal | Base local cifrada y separada por cuenta | Continuidad de UI | Hasta logout o limpieza local |
| Preferencias | Tema, idioma y configuración visual | No sensible | `@capacitor/preferences` | Personalizar la experiencia | Hasta que la persona la cambie o borre datos |

No se guardan contraseñas ni cookies. El único módulo que toca el plugin SecureStorage es `services/storage/secureToken.ts`, incluyendo sus wrappers para snapshot y clave. El cierre de sesión elimina token/snapshot, base local, preferencias registradas, recordatorios y queries de negocio. El navegador de desarrollo conserva un adaptador local sin garantías de cifrado y no es un target de distribución.

## Base local y mantenimiento

`services/local/local-database.ts` conserva IndexedDB para el volumen variable de caché/outbox. En nativo cifra cada valor con AES-GCM y nonce aleatorio de 12 bytes, autenticando también la clave `cuenta:recurso`. Mover un valor entre cuentas/recursos impide descifrarlo. Las modificaciones nativas se serializan fuera de las transacciones IndexedDB para no cerrarlas mientras WebCrypto trabaja.

Al abrir la base nativa se cifran registros previos conservando exactamente sus claves de cuenta; se compara el valor anterior antes de escribir y no se reasignan datos. Preferencias históricas sin dueño no se importan en cuentas nativas. Los lectores validan esquema/versión/fecha y rechazan valores corruptos, futuros o vencidos. El TTL limita el uso: registros vencidos pueden permanecer cifrados en disco hasta reemplazo o limpieza de sesión; no se promete borrado periódico con la app cerrada.

El snapshot queda vinculado a la credencial exacta y a la expiración `exp` recibida del servidor. Un token nuevo no reutiliza la identidad anterior. Un error de red permite el snapshot vigente; un 401 definitivo elimina snapshot/token y caché. Las respuestas de sesiones anteriores no se guardan para cuentas nuevas.

## Sincronización y conflictos

La fecha de descarga se registra al recibir una respuesta válida y se conserva al leer offline. El UUID de creación es solo local: el endpoint no documenta claves de idempotencia. No garantiza entrega exactamente una vez. La cola valida la sesión remotamente antes de enviar en nativo y comparte una ejecución activa.

Una respuesta perdida de POST marca resultado incierto y detiene reenvíos automáticos. Mis rutinas pide revisar la lista y confirmar el riesgo de duplicado antes del reintento manual. Cinco fallos suspenden la operación sin descartarla. Los reintentos de GET mantienen su política independiente.

Al reconectar se actualizan consultas, progreso e historial desde el servidor. Completar/desmarcar, editar/eliminar rutinas, agregar pasos y gestionar vínculos requieren conexión. Los datos de estudiantes ajenos no se persisten ni se muestran offline a adultos, incluso si estaban en memoria tras una consulta online.

## Modo avión

Pruebas de sesión/expiración, aislamiento, caché paginada, manipulación del cifrado y respuesta perdida de POST junto a sus servicios. Procedimiento y límites de validación nativa en `docs/evidence/offline-mode.md`; comprobación en perfil temporal mediante `scripts/verify-android-offline.mjs`.
