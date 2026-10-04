# 004 · Rediseño visual de login y home

**Estado:** implementado ✅

## Qué hace

Renueva la experiencia visual del inicio de sesión y de la pantalla principal de Canchago con una interfaz móvil clara, moderna y familiar, inspirada en la jerarquía visual de Facebook: identidad de marca visible, superficies limpias, acción primaria azul, formularios fáciles de recorrer y contenido organizado en tarjetas.

Después de autenticarse, el usuario verá un `Home` tipo panel con un saludo personalizado, un resumen de su cuenta y accesos únicamente a capacidades reales disponibles para su rol o permisos. La experiencia debe funcionar en Android e iOS, en modo claro y oscuro, sin alterar los flujos de autenticación existentes.

## Por qué

El login actual cumple su función, pero se presenta como un formulario técnico sin identidad visual ni jerarquía suficiente. El `Home` expone nombre, correo, roles y mensajes de guards como contenido de diagnóstico, por lo que todavía no se percibe como la pantalla principal de una aplicación lista para usuarios finales.

Este rediseño mejora la primera impresión, la legibilidad y la confianza del usuario, y deja una base visual reutilizable para los futuros módulos de organizaciones, sedes, usuarios, roles y reservas.

## Objetivos

- Hacer que la acción principal de inicio de sesión sea identificable sin ambigüedad y esté visible sin desplazamiento en teléfonos compatibles.
- Reemplazar la apariencia técnica del `Home` por un panel útil que priorice identidad, contexto de cuenta y acciones disponibles.
- Mantener intactos el login nativo de la feature `003`, el login web/dev de la feature `002`, la persistencia de sesión y el logout.
- Cumplir contraste, navegación por teclado, etiquetas accesibles y áreas táctiles mínimas de 44 × 44 px.

## Historias de usuario

- Como deportista, quiero reconocer rápidamente dónde ingresar mis credenciales para entrar sin confusión.
- Como usuario autenticado, quiero ver mi nombre y contexto de cuenta al abrir la app para confirmar que estoy usando la sesión correcta.
- Como usuario con roles o permisos específicos, quiero ver solo accesos que correspondan a capacidades disponibles para mi cuenta.
- Como usuario con un error de validación, credenciales incorrectas o un problema de red, quiero recibir un mensaje visible y comprensible sin perder los datos no sensibles ya ingresados.
- Como usuario de modo oscuro o con tecnologías de asistencia, quiero conservar una experiencia legible y operable.

## Contrato de API consumido

No se incorpora ningún endpoint nuevo. Se reutilizan los contratos verificados en `../../constitution/api-integration.md` §§2–3:

- `POST /api/auth/mobile/login` — público; body `{ username, password }`; responde `{ data: { sessionToken, expiresAt } }`. Solo se usa en la app nativa.
- `GET /api/auth/login` — público; inicia el flujo OAuth web/dev existente.
- `GET /api/auth/session` — autenticación requerida; responde `{ data: SessionUser }` con `id`, `email`, `name`, `roles` y `permissions`.
- `POST /api/auth/logout` — autenticación requerida; responde `204`.

## Requisitos P0

- Login nativo con bloque de marca, título, texto de apoyo, campos de usuario y contraseña, control para mostrar/ocultar contraseña y botón primario claramente jerarquizado.
- Login web/dev visualmente coherente con el nativo, manteniendo su redirección OAuth y sin solicitar credenciales dentro de la aplicación.
- Fondo, contenedor y espaciado adaptables a teléfonos pequeños y grandes, considerando `safe-area` de iOS y Android.
- Estados visibles de foco, validación, envío, credenciales incorrectas y error general; el botón permanece bloqueado durante el envío.
- `Home` con encabezado de bienvenida, avatar textual o iniciales sin depender de imágenes externas, correo y resumen de roles de la sesión real.
- Las secciones o acciones condicionadas por rol/permisos continúan usando `RoleGuard` y `PermissionGuard`; no se simula autorización en la capa visual.
- Logout visible pero con menor jerarquía que las acciones principales, conservando su estado de carga y limpieza segura de sesión.
- Tema claro y oscuro mediante tokens CSS semánticos, sin colores ilegibles ni valores duplicados innecesariamente entre pantallas.
- Sin imágenes, logotipos, iconos ni textos propiedad de Facebook; la referencia es únicamente de lenguaje visual.

## Requisitos P1

- Microinteracciones discretas de entrada y presión que respeten `prefers-reduced-motion`.
- Componentes visuales reutilizables para marca, tarjeta de perfil y tarjetas de acción futuras.
- Estado vacío útil cuando la sesión no tenga roles asignados, sin mostrar una lista en blanco.

## Criterios de aceptación

- [x] En Android e iOS, el login nativo muestra marca, formulario completo y acción primaria sin desbordamiento horizontal a 320 px de ancho.
- [x] En navegador/dev, el login conserva el flujo OAuth de la feature `002` y adopta el mismo lenguaje visual sin mostrar campos de usuario y contraseña.
- [x] Usuario y contraseña conservan etiquetas accesibles; los errores aparecen asociados visualmente al campo correspondiente.
- [x] Al enviar, el botón evita el doble envío y comunica el estado de carga; al fallar, se presenta un mensaje en español que no revela detalles técnicos.
- [x] El control de contraseña es operable por teclado y lector de pantalla, y no altera el valor del campo.
- [x] El `Home` usa únicamente `SessionUser` para mostrar nombre, correo, iniciales, roles y capacidades visibles.
- [x] Un usuario sin roles ve un estado vacío comprensible y la pantalla continúa siendo utilizable.
- [x] Las vistas condicionadas siguen respetando `RoleGuard` y `PermissionGuard`; el rediseño no concede acceso ni reemplaza la autorización del backend.
- [x] Cerrar sesión mantiene el comportamiento validado en las features `002` y `003` y muestra feedback mientras la operación está pendiente.
- [x] Login y `Home` son legibles en tema claro y oscuro, con foco visible, áreas táctiles mínimas de 44 × 44 px y movimiento reducido cuando el sistema lo solicita.
- [x] No se incorporan llamadas HTTP nuevas, dependencias, recursos remotos ni elementos de marca de Facebook.
- [x] Existen pruebas de componente para los estados principales del login y del `Home`.

### Contratos y tipos (obligatorio)

- [x] `src/types/api/auth.ts` continúa reflejando exactamente los contratos reales utilizados, sin `any`.
- [x] Se confirma que `../../constitution/api-integration.md` no requiere cambios porque esta feature no modifica ni descubre contratos.

## Métricas de éxito

- 100 % de los estados definidos (normal, foco, validación, carga y error) cubiertos por pruebas de componente.
- Cero regresiones en las pruebas existentes de login, sesión, guards y logout.
- Cero desbordamientos horizontales en anchos de 320 px, 390 px y 768 px.
- Todos los controles interactivos principales con nombre accesible y área táctil mínima de 44 × 44 px.

## Fuera de alcance

- Crear un feed social, publicaciones, historias, chat, notificaciones o cualquier comportamiento propio de Facebook.
- Copiar la marca, el logotipo, los recursos gráficos o la composición exacta de Facebook.
- Agregar registro, recuperación de contraseña, MFA o login social; requieren contratos y features independientes.
- Crear datos de negocio ficticios o accesos a módulos que el backend todavía no expone.
- Modificar autenticación, almacenamiento seguro, sesión, permisos o código del backend `canchago`.

## Resultado de implementación

Implementada el 2026-08-14 sin cambios de contrato ni dependencias nuevas. El login web/dev y el nativo comparten ahora `AuthShell`, conservando sus mecanismos de autenticación independientes. El `Home` usa `ProfileSummary` y `HomeActionCard` con información derivada únicamente de `SessionUser` y mantiene los guards existentes.

Validación completada: `yarn lint`, `yarn typecheck`, 27 pruebas en 11 archivos, `yarn build`, `yarn cap:sync`, Android `assembleDebug` e iOS Simulator `xcodebuild`; todos finalizaron correctamente. Vite conserva un warning no bloqueante por chunks superiores a 500 kB, preexistente y fuera del alcance visual de esta feature.
