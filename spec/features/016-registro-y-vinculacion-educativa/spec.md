# 016 · Registro y vinculación educativa

Solicitud autorizada: completar desde la aplicación el acceso de padres y docentes al progreso. Se extiende el backend local y el cliente, preservando datos y contratos anteriores.

## Experiencia

- Registro con perfil Estudiante (predeterminado), Padre/madre de familia o Docente. El servidor limita los roles permitidos; no se admite administrador.
- Cada adulto ve su nombre de usuario en «Vincular estudiantes» y las instrucciones para compartirlo con su estudiante/familia.
- El estudiante abre «Mis acompañantes», busca el usuario exacto del adulto y confirma nombre, usuario y perfil antes de autorizar la consulta de sus actividades.
- Solo el estudiante autenticado puede crear/eliminar sus relaciones. El cliente nunca envía un studentId para decidir sobre otra cuenta.
- Listado de acompañantes y revocación con confirmación. Eliminar el vínculo no elimina usuarios, tareas ni cumplimientos.
- Los adultos consultan progreso solo después de autorizarse la relación. No pueden completar tareas ajenas.

## Contrato a implementar y verificar

- POST /auth/mobile/register añade role?: estudiante | padre_familia | docente; ausente conserva estudiante.
- GET /acompanantes → {data:{username,companions:Companion[]}}. Estudiante: acompañantes actuales; adulto: username propio y lista vacía, para instrucciones de vinculación.
- POST /acompanantes/buscar {username} → {data:Companion}; solo estudiante, búsqueda exacta normalizada, únicamente adultos. Sin listados globales, correo ni datos de estudiantes.
- POST /acompanantes {adultId} → {data:Companion}; solo estudiante, id UUID, adulto existente de rol permitido, alta idempotente incluso con peticiones concurrentes.
- DELETE /acompanantes/{adultId} → 204; solo relaciones del estudiante autenticado, idempotente.
- Companion: {id,name,username,role}; role normalizado padre_familia | docente, compatible con roles previos padre/tutor.
- Errores: 401 sin sesión, 403 rol no autorizado, 404 adulto no encontrado, 422 entrada inválida, 500 genérico.

## Aceptación

Registrar los tres perfiles desde Android; adulto sin acceso antes del vínculo, ambos adultos consultan después, otro estudiante permanece aislado; revocar retira el acceso en el servidor. Relaciones persistentes en las tablas existentes, sin migraciones ni seeds sobre usuarios reales. Formularios Zod, confirmaciones, estados vacíos/error/carga, checks y pruebas reales.

La elección del rol no verifica una acreditación profesional; únicamente identifica el tipo de cuenta. El acceso a cada estudiante depende de la autorización desde su cuenta, que puede realizar con ayuda de su familia.
