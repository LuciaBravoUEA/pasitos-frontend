# 008 · Sistema de diseño accesible y catálogo de componentes — Tareas

_Checklist pendiente. No implementar hasta que el usuario apruebe la spec y el plan._

## Fundamentos

- [x] Confirmar el inventario de pantallas contra `api-integration.md`.
- [x] Registrar patrones que se repiten en tres o más pantallas.
- [x] Definir paleta primitiva clara/oscura.
- [x] Definir tokens semánticos que referencien primitivas.
- [x] Crear matriz de contraste WCAG 2.2 AA con ratio, contexto y resultado.
- [x] Corregir todos los pares que no alcancen AA.
- [x] Declarar escala tipográfica y line-height en `rem`.
- [x] Declarar unidad base y escala de espaciado.
- [x] Declarar radios y tamaño táctil mínimo.
- [x] Reemplazar literales visuales dispersos en el alcance migrado.

## Catálogo

- [x] Ajustar e implementar la interfaz pública de `AppButton`.
- [x] Ajustar `AppInput` preservando compatibilidad.
- [x] Implementar `AppCard` mediante slots/composición.
- [x] Implementar `ResourceState` para loading, empty, error y success.
- [x] Documentar propiedades obligatorias, opcionales y defaults.
- [x] Comprobar que ningún componente importa API, TanStack Query ni router.
- [x] Añadir pruebas de estados, callbacks, contenido delegado y nombres accesibles.

## Errores y pantalla real

- [x] Implementar el traductor central de códigos/estados a mensajes de usuario.
- [x] Probar los códigos representativos y documentar todos los códigos reales.
- [x] Ensamblar `Home` con componentes del catálogo.
- [x] Mantener datos locales explícitamente separados de contratos API.
- [x] Verificar que las páginas conservan la navegación y los componentes solo emiten callbacks.

## Accesibilidad y adaptación

- [x] Comprobar área táctil mínima de cada control.
- [x] Añadir nombres accesibles a controles sin texto visible.
- [x] Verificar jerarquía de encabezados, regiones y mensajes dinámicos.
- [ ] Recorrer la pantalla con TalkBack y registrar evidencia.
- [x] Probar ancho de 320 px.
- [x] Probar ancho de 768 px.
- [x] Probar fuente del sistema al 200 %.
- [x] Probar temas claro y oscuro mediante tokens y matriz de contraste.
- [x] Guardar capturas y una lista de resultados en `docs/accessibility/`.

## Cierre

- [x] Ejecutar `yarn lint`.
- [x] Ejecutar `yarn typecheck`.
- [x] Ejecutar `yarn test`.
- [x] Ejecutar `yarn build`.
- [x] Ejecutar `yarn cap:sync`.
- [ ] Completar criterios de aceptación.
- [ ] Actualizar el roadmap y mover la feature a “Hecho”.
