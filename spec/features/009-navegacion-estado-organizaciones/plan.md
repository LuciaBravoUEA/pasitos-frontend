# 009 · Navegación, estado y flujo CRUD verificable — Plan

_No implementar hasta que el usuario apruebe esta propuesta._

## Preparación contractual

1. Verificar directamente el request/response de organizaciones y sedes contra el backend si está disponible localmente.
2. Confirmar envelopes excepcionales `{ organizations, meta }` y `{ venues, meta }`.
3. Registrar cualquier diferencia real en `api-integration.md` antes de implementar.

## Implementación

1. Crear constantes y utilidades tipadas para rutas internas, `returnTo`, UUID y query string.
2. Separar `/registro` de `/login` y configurar rutas privadas de organizaciones.
3. Actualizar `ProtectedRoute` para preservar ruta y query pretendidas.
4. Actualizar login web/nativo para restaurar un destino interno validado.
5. Implementar tipos API y endpoints de organizaciones/sedes en `services/api/`.
6. Implementar hooks TanStack Query con query keys por recurso y parámetros.
7. Crear `RemoteData<T>` y adaptador de queries hacia el catálogo.
8. Implementar listado paginado usando `ResourceState`, `AppCard` y `AppButton`.
9. Implementar detalle desde `useParams<{ organizationId: string }>`.
10. Implementar ruta anidada de sedes desde el mismo parámetro padre.
11. Verificar el request de creación y crear schema Zod equivalente.
12. Implementar formulario con `mode: 'onBlur'`, submit, mensajes correctivos y asociación segura de errores del servidor.
13. Implementar persistencia/limpieza del borrador no sensible con Preferences.
14. Diferenciar navegación ante `AuthenticationError` y `AuthorizationError`.
15. Añadir pruebas unitarias, componentes e integración de rutas/hook/servicio.
16. Ejecutar el recorrido real en Android y guardar capturas de login, listado, detalle y creación.
17. Ejecutar suite obligatoria, sync y build Android.
18. Cerrar tasks/spec y actualizar roadmap solo cuando toda la evidencia exista.

## Riesgos

- El usuario de prueba puede carecer de `organizaciones.read/manage`; un 403 real debe documentarse y no sustituirse con datos ficticios.
- El backend local puede no estar disponible durante la evidencia.
- El requisito académico de 422 no coincide con el contrato real de 400.
- Persistir borradores requiere evitar datos sensibles y limpiar correctamente tras éxito.

