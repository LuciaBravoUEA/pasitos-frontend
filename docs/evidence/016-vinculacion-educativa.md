# Registro y vinculación educativa

Verificación: 2026-10-01.

## Resultado

El registro permite elegir estudiante, padre/madre o docente. Las cuentas existentes conservan su rol. El estudiante busca el usuario exacto del adulto, comprueba su identidad y autoriza el acceso desde «Mis acompañantes». Puede retirarlo con confirmación. Padres y docentes consultan el progreso diario de los estudiantes autorizados, sin completar sus tareas ni asignarse estudiantes.

## Comprobaciones realizadas

- Cliente: lint, typecheck, 133 pruebas en 39 archivos y build satisfactorios.
- Backend: lint de archivos modificados y compilación Next con verificación TypeScript satisfactorios.
- API real y PostgreSQL: roles permitidos, validaciones, autenticación, aislamiento entre estudiantes, acceso adulto de solo lectura, autorización simultánea idempotente y retirada de acceso sin borrar tareas.
- Reinicio real del backend: sesiones, relaciones y progreso conservaron sus datos.
- Capacitor sync y compilación Android satisfactorios; APK actualizado mediante instalación conservando datos.
- Emulador Android: registro de los tres perfiles desde la interfaz, creación y cumplimiento de actividad, autorización de ambos adultos, consulta de ambos reportes y retirada del acceso familiar. Las cuentas temporales fueron eliminadas tras la prueba.
- Se utilizó un perfil Android temporal para preservar la sesión habitual. Al finalizar se restauró el perfil principal y se eliminó únicamente el temporal.

Scripts reproducibles: `scripts/verify-educational-links.mjs` y `scripts/verify-android-educational-links.mjs`. El segundo exige un perfil Android distinto del principal para proteger los datos habituales.

## Capturas

- [Registro docente](016-android/registro-docente.png)
- [Instrucciones para familia](016-android/instrucciones-padre_familia.png)
- [Acompañantes autorizados](016-android/acompanantes-vinculados.png)
- [Reporte familiar](016-android/reporte-padre_familia.png)
- [Reporte docente](016-android/reporte-docente.png)
- [Acceso retirado](016-android/acceso-retirado.png)

## Alcance y límites

Se reutilizaron StudentGuardian y StudentTeacher, sin migraciones. Elegir docente durante el registro no certifica credenciales profesionales. Los reportes muestran progreso diario; no se añadió un reporte histórico semanal. Este recorrido no se ejecutó en iOS ni en un dispositivo físico.

Guion para presentar las tres cuentas: [guía del video](../guia-video-tutorial.md).
