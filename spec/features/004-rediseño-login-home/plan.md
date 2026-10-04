# 004 · Rediseño visual de login y home — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar `../../constitution/tech-stack.md`._

## Enfoque

El rediseño se implementará sobre los componentes y flujos existentes, separando estilos de presentación de la lógica de autenticación. Se usarán componentes Ionic, CSS modular por pantalla o feature y tokens semánticos globales para conseguir una apariencia consistente en claro/oscuro sin introducir una librería visual adicional.

La referencia a Facebook se traducirá en patrones generales —marca prominente, fondo neutro, tarjeta enfocada, acción azul y jerarquía simple—, no en una réplica. El `Home` será un panel de cuenta basado exclusivamente en `SessionUser`; cualquier acceso futuro se mostrará solo cuando exista una ruta funcional y el guard correspondiente.

## Implementación

1. **Auditoría visual y de accesibilidad** — registrar los estados actuales de `LoginPage`, `Home`, `AppInput`, `AppButton` y `AppPage`; definir los estados normal, foco, error, carga, vacío, claro y oscuro que deben cubrirse.
2. **`src/theme/variables.css`** — definir tokens semánticos de marca, fondos, superficies, bordes, texto, sombras, radios y espaciado para temas claro y oscuro, respetando las variables de Ionic.
3. **`src/features/auth/components/AuthShell.tsx`** — crear un contenedor presentacional reutilizable para identidad de Canchago, texto introductorio, ancho máximo, safe areas y tarjeta del login; no contendrá lógica de sesión ni red.
4. **`src/features/auth/pages/LoginPage.tsx`** — conservar la bifurcación `Capacitor.isNativePlatform()` y la lógica existente, componiendo `WebLogin` y `NativeLoginForm` dentro de `AuthShell`; mejorar semántica, mensajes y estados accesibles sin cambiar endpoints.
5. **`src/features/auth/pages/login-page.css`** — implementar el layout adaptable y los estados visuales del login; incluir reglas para teclado visible, orientación horizontal, dark mode y `prefers-reduced-motion`.
6. **`src/components/forms/AppInput.tsx`** — ajustar solo capacidades visuales o accesibles que sean reutilizables, manteniendo compatibilidad con React Hook Form, Zod e `IonInputPasswordToggle`.
7. **`src/components/common/AppButton.tsx`** — asegurar altura táctil, foco visible y estado de carga accesible sin cambiar su contrato público salvo que una propiedad semántica resulte necesaria.
8. **`src/features/home/components/ProfileSummary.tsx`** — extraer una tarjeta presentacional que derive iniciales de forma segura desde el nombre y muestre nombre, correo y roles reales; contemplar ausencia de roles.
9. **`src/features/home/components/HomeActionCard.tsx`** — crear el patrón reutilizable para acciones reales del panel, con título, descripción, icono Ionic y estado accesible; no renderizar destinos inexistentes.
10. **`src/pages/Home.tsx`** — reemplazar la presentación de diagnóstico por encabezado, resumen de perfil, secciones permitidas mediante los guards existentes y logout secundario; conservar `useSessionStore` y `useLogoutMutation`.
11. **`src/pages/home.css`** — implementar rejilla adaptable, tarjetas, jerarquía y variantes claro/oscuro sin estilos inline.
12. **Pruebas de componentes** — cubrir variantes nativa/web del login, validación, carga, error de autenticación, sesión con/sin roles, contenido protegido y logout pendiente; conservar las pruebas existentes.
13. **Validación visual** — comprobar 320 × 568, 390 × 844 y 768 × 1024 en claro/oscuro; verificar safe areas, teclado, orientación, foco, lector de pantalla y reducción de movimiento.
14. **Validación nativa** — ejecutar `yarn cap:sync` y probar al menos un build Android y uno iOS, dado que el objetivo real es el WebView nativo.
15. **Cierre SDD** — completar criterios y tareas, ejecutar la suite obligatoria y mover la feature a “Hecho” en el roadmap solo después de validar.

## Contratos y tipos

- **`src/types/api/auth.ts`** — no se prevén cambios; revisar que `SessionUser` y la respuesta móvil sigan coincidiendo con el contrato ya verificado.
- **`../../constitution/api-integration.md`** — no se prevén cambios porque el rediseño no agrega endpoints ni modifica requests/responses; documentar solo si la implementación descubre una diferencia real.

## Decisiones

- **Inspiración, no clon visual** — se adoptan principios generales de familiaridad y jerarquía sin usar propiedad intelectual ni inducir a pensar que Canchago pertenece a Facebook.
- **Sin librería UI adicional** — Ionic y CSS cubren el alcance; otra dependencia aumentaría bundle y mantenimiento sin necesidad comprobada.
- **Tokens semánticos antes que colores por pantalla** — facilita claro/oscuro y mantiene consistencia para features futuras.
- **Datos reales antes que contenido decorativo** — el `Home` no tendrá feed, métricas ni accesos ficticios; mostrará sesión y capacidades que ya existen.
- **Lógica de auth intacta** — el cambio se limita a composición, semántica y estilos para reducir el riesgo sobre los flujos reales ya validados.

## Riesgos

- **Teclado nativo cubre el formulario** — mitigar con contenido desplazable, safe areas y prueba en WebView Android/iOS.
- **CSS global afecta pantallas existentes** — limitar estilos a clases de feature y reservar `variables.css` para tokens.
- **Contraste insuficiente en dark mode** — validar cada token y estado interactivo en ambos temas.
- **Acciones del `Home` sin módulo implementado** — no renderizar enlaces hasta que la ruta sea funcional; usar guards para capacidades protegidas.
- **Regresión de autenticación por refactor visual** — no mover llamadas de red ni almacenamiento; respaldar con pruebas existentes y pruebas de componente nuevas.

