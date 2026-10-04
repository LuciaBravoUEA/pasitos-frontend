# 009 · Navegación, estado y flujo CRUD verificable — Tareas

_Pendiente de aprobación._

> Bloqueada: la inspección directa de `pasitos-backend` confirmó que no existen los endpoints de organizaciones/sedes documentados históricamente. Se requiere autorización para ampliar el backend con rutinas o recuperar el backend anterior.

## Contratos

- [ ] Verificar request/response real de listado, detalle y creación de organizaciones.
- [ ] Verificar listado anidado de sedes.
- [ ] Confirmar códigos 400, 401 y 403 aplicables.
- [ ] Actualizar `api-integration.md` si aparece alguna diferencia.

## Rutas

- [ ] Crear mapa de rutas definitivo.
- [ ] Configurar `/registro` como ruta pública.
- [ ] Configurar listado, nueva, detalle y sedes como rutas privadas.
- [ ] Implementar parámetros de path y query string.
- [ ] Probar deep-links sin objetos previos.
- [ ] Preservar y validar `returnTo`.
- [ ] Restaurar el destino tras login web y nativo.
- [ ] Probar tratamiento distinto de 401 y 403.

## Estado y API

- [ ] Documentar clasificación de estado.
- [ ] Implementar tipos y endpoints de organizaciones/sedes.
- [ ] Implementar hooks TanStack Query.
- [ ] Implementar `RemoteData<T>` cerrado.
- [ ] Conectar operación remota con `ResourceState`.
- [ ] Confirmar token en SecureStorage y usuario en Zustand/TanStack Query.

## Pantallas y formulario

- [ ] Implementar listado paginado con catálogo.
- [ ] Implementar detalle reconstruible.
- [ ] Implementar sedes como pantalla anidada.
- [ ] Derivar Zod del request real de creación.
- [ ] Validar en blur y submit.
- [ ] Redactar mensajes correctivos por campo.
- [ ] Asociar `details[]` del backend mediante lista blanca.
- [ ] Conservar borrador no sensible al navegar y regresar.
- [ ] Limpiar borrador tras éxito/cancelación.

## Evidencia y cierre

- [ ] Probar login → listado → detalle → creación en Android.
- [ ] Guardar capturas y notas del recorrido.
- [ ] Documentar la diferencia 400 frente al 422 solicitado.
- [ ] Ejecutar lint, typecheck, test y build.
- [ ] Ejecutar `cap:sync` y compilar APK Android.
- [ ] Completar criterios y actualizar roadmap.
