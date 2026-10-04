# Plan

1. Reutilizar StudentGuardian y StudentTeacher. Añadir un repositorio pequeño de vínculos con selección mínima de identidad, whitelist de roles y operaciones por studentId autenticado.
2. Extender el registro con rol opcional y validación servidor. Mantener respuesta de sesión y login.
3. Añadir handlers Next con readSession, validación de UUID/cuerpo y errores coherentes; contrastar contrato por HTTP real.
4. Cliente: tipos Zod, funciones en services/api, hooks TanStack Query con keys por usuario y refresco al entrar. Registrar una ruta protegida /acompanantes.
5. Flujo de búsqueda y confirmación en dos pasos; revocación explícita. El perfil adulto recibe instrucciones y su username, sin capacidades de asignarse estudiantes.
6. Pruebas de roles inválidos, autorización, acceso antes/después, persistencia, duplicados y revocación. Frontend, build backend, sync, APK y recorrido Android con cuentas temporales propias.
7. Actualizar contrato, roadmap y guía con un guion reproducible de las tres cuentas.

## Ajuste encontrado en la prueba real

Dos upserts concurrentes con update vacío podían producir una colisión de índice único. Se sustituyó el alta de relaciones por createMany con skipDuplicates, conservando los índices únicos existentes. El script prueba explícitamente dos autorizaciones simultáneas.

El recorrido Android mostró una transición con vistas ocultas al cambiar de cuenta. Se aisló la navegación de cada ingreso mediante una revisión que remonta IonReactRouter, sin reiniciarlo durante actualizaciones de la misma sesión ni durante la limpieza del logout. También se detectó que el perfil Android temporal entraba en reposo a los 30 segundos; el script mantiene despierto ese perfil durante la prueba. No se atribuye el síntoma únicamente a la caché. La regresión de sesión y el recorrido completo de tres cuentas pasaron, preservando el perfil principal.
