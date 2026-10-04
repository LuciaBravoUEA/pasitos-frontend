# 008 · Sistema de diseño accesible y catálogo de componentes — Plan

_Esta propuesta no se implementa hasta recibir aprobación del usuario._

## Enfoque

La implementación será incremental: primero se consolida el tema, luego se construyen componentes presentacionales, después se adapta `Home` y finalmente se generan pruebas y evidencias manuales. No cambia contratos de API ni lógica de autenticación.

## Implementación

1. Inventariar todos los pares reales de primer plano/fondo en claro y oscuro.
2. Crear la paleta primitiva y hacer que los tokens semánticos referencien exclusivamente esa paleta.
3. Calcular contraste con una utilidad determinista y guardar una matriz de evidencia en la spec o en `docs/accessibility/`.
4. Añadir tokens tipográficos, line-height, espaciado, radios, tamaño táctil y foco al tema Ionic.
5. Sustituir valores visuales dispersos en los archivos migrados por tokens del tema.
6. Normalizar `AppButton` y `AppInput` sin romper los formularios existentes.
7. Implementar `AppCard` y `ResourceState` por composición, con interfaces tipadas y defaults explícitos.
8. Añadir una función central de mensajes de UI para los errores reales de `errorMapper.ts`.
9. Refactorizar `Home` para que orqueste datos/callbacks y delegue la presentación repetible al catálogo.
10. Añadir pruebas de contrato público, estados, accesibilidad semántica y ausencia de dependencias de red/navegación.
11. Verificar automáticamente tamaños mínimos donde sea viable y completar la inspección manual en Android.
12. Ejecutar TalkBack recorriendo encabezados, regiones, tarjetas, controles, mensajes dinámicos y orden de foco.
13. Probar 320 px y 768 px, tema claro/oscuro y fuente ampliada al 200 %; guardar capturas y resultados.
14. Ejecutar la suite obligatoria y `yarn cap:sync`.
15. Actualizar `tasks.md`, evidencias y roadmap únicamente cuando todos los criterios estén cumplidos.

## Decisiones

- Se adopta 44 × 44 CSS px como mínimo transversal y se busca 48 × 48 dp en Android.
- `ResourceState` recibe estado ya resuelto; no recibe objetos de TanStack Query para evitar acoplamiento.
- Los componentes no reciben destinos de ruta. La navegación queda en callbacks creados por la página.
- La matriz de contraste incluirá uso y tamaño de texto; un color no se considera válido en abstracto, sino para un par y contexto concretos.
- Las pantallas futuras de CRUD no se implementan en esta feature; sirven para justificar patrones y interfaces.

## Riesgos

- Cambiar el primario naranja puede alterar la identidad visual; se conservará como superficie/acento cuando no sea apto para texto.
- Los componentes Ionic encapsulan partes en Shadow DOM; la verificación táctil se hará sobre el host renderizado y en el dispositivo.
- El escalado de fuente en WebView puede variar por plataforma; la evidencia manual tendrá prioridad sobre una captura de navegador.
- `Home` contiene rutinas locales sin endpoint; el refactor no debe presentarlas como datos persistidos.

