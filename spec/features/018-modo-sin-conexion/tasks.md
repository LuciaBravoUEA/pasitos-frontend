# 018 · Modo sin conexión — Tareas

- [x] Revisar constitución, contratos documentados y base offline de 010.
- [x] Preparar spec y plan con alcance y límites explícitos.
- [x] Confirmar propuesta con el usuario antes de implementar (AGENTS.md §2).
- [x] Verificar backend en lectura: sesión, expiración y contratos consumidos.
- [x] Definir vigencia, retención y almacenamiento cifrado de identidad/datos educativos.
- [x] Implementar restauración offline y tratamiento diferenciado de error de red/401.
- [x] Integrar conectividad, repositorios y caché propia de progreso/historial.
- [x] Conservar paginación real en caché de rutinas.
- [x] Mostrar estado offline, última actualización y estados sin caché.
- [x] Bloquear operaciones que requieren conexión y mantener cola existente de creación.
- [x] Coordinar reconexión, validación de sesión y sincronización.
- [x] Comprobar aislamiento, logout y cambio de cuenta (pruebas automatizadas y recorrido Android).

## Contratos y tipos

- [x] Validar tipos/schemas contra backend sin inventar campos ni endpoints.
- [x] Actualizar api-integration.md si se detectan divergencias (`exp` y `username` de sesión).

## Cierre

- [x] Pruebas de arranque offline, errores, expiración, paginación y aislamiento.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` (151 pruebas).
- [x] `yarn cap:sync` si se modifica integración nativa.
- [x] Recorrido real en Android en modo avión y documentar alcance de validación iOS.
- [x] Actualizar inventario de almacenamiento y evidencia offline.
- [x] Validar criterios y actualizar roadmap; solo entonces declarar completada.
