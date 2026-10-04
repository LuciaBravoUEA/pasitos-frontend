# Plan

1. Extender validación/repository/handlers del backend existente sin migraciones destructivas; usar modelos Task y Routine ya presentes. Consultar la documentación Next instalada.
2. Verificar los contratos implementados y reflejarlos en tipos Zod, capa API y repositorio cliente.
3. Extender formulario de creación con pasos; formulario de edición con Zod; detalle con tareas, alta y confirmación de eliminación.
4. Sustituir estado demostrativo de Home por consultas/mutaciones de seguimiento, mantener perfil, navegación, chatbot y mensajes.
5. Invalidar consultas y cachés tras mutaciones y refrescar al entrar en pantallas Ionic; fecha local del dispositivo.
6. Probar CRUD/aislamiento/persistencia, ejecutar checks y preparar guía del video. No borrar datos del usuario para las pruebas.

## Ajustes encontrados al verificar

- La página auxiliar Next dependía de descargar Geist de Google. Se reemplazó por fuentes del sistema para compilar sin acceso a Google Fonts.
- El antivirus local intercepta TLS y su raíz no está en Java. scripts/build-android-local.ps1 crea un almacén de compilación local a partir del JDK y certificados públicos ya confiables para Windows; no desactiva HTTPS ni altera almacenes globales.
- PostgreSQL usa volumen persistente y se configuró restart unless-stopped, igual que el backend.

## Corrección de registro encontrada en Android

Una consulta anónima anterior podía terminar con 401 después de guardar el token del registro y borrar la sesión nueva. Se añadió generación de credenciales (sin datos sensibles), cancelación de consultas de sesión con AbortSignal al cambiar credenciales y exclusión de login/registro del flujo de refresh. Tres regresiones cubren respuesta antigua, renovación tardía y credenciales incorrectas.
