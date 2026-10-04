# 008 · Sistema de diseño accesible y catálogo de componentes

**Estado:** implementada; pendiente de recorrido manual final con TalkBack

## Qué hace

Formaliza el sistema visual de Pasitos Mágicos a partir de los contratos reales de la API. Define el inventario de pantallas, patrones repetidos, tokens primitivos y semánticos, tipografía, espaciado, radios, componentes reutilizables y evidencias de accesibilidad requeridas para una entrega académica verificable.

La feature no agrega endpoints ni reglas de negocio. Los componentes del catálogo son exclusivamente presentacionales: reciben datos y callbacks, no consultan el backend y no conocen rutas de navegación.

## Inventario de pantallas derivado de endpoints

| Contrato real | Pantallas necesarias | Estado del contrato |
|---|---|---|
| `GET /api/auth/login`, callback OAuth | Inicio de sesión web/dev y resultado de autenticación | Verificado |
| `POST /api/auth/mobile/login` | Inicio de sesión nativo | Verificado |
| `POST /api/auth/mobile/register` | Registro nativo de desarrollo | Solo entorno local; no es contrato de producción |
| `GET /api/auth/session`, `POST /api/auth/logout` | Inicio/panel de sesión y cierre de sesión | Verificado |
| `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/{userId}` | Lista, creación, detalle/edición y confirmación de baja de usuarios | Bloqueado por incompatibilidad conocida de permisos |
| Roles de usuario | Asignación y retiro de roles desde el detalle de usuario | Bloqueado por la misma incompatibilidad de permisos |
| `GET/POST /api/organizaciones`, detalle `GET/PATCH/DELETE` | Lista, creación y detalle/edición de organizaciones | Verificado; envelope de lista excepcional |
| Endpoints anidados de sedes | Lista, creación y detalle/edición de sedes por organización | Verificado; envelope de lista excepcional |
| `GET/POST /api/roles`, detalle `GET/PATCH/DELETE` | Lista, creación y detalle/edición de roles por organización | Verificado; exige `organizationId` como query |
| Permisos de rol y `GET /api/permisos` | Selección de permisos en alta/edición de rol | Verificado; catálogo global de solo lectura |

Las pantallas de rutinas, recompensas e informes que hoy existen son demostrativas y locales. No se presentan como derivadas de API hasta que el backend exponga un contrato aprobado para ese dominio.

## Patrones visuales repetidos en tres o más pantallas

1. **App shell:** página Ionic, encabezado, título, safe areas, ancho máximo y contenido desplazable.
2. **Estado de recurso:** cargando, vacío, error recuperable y contenido disponible.
3. **Colección paginada:** encabezado, búsqueda/filtros, tarjetas o filas, acción principal y paginación.
4. **Formulario:** título, campos etiquetados, validación por campo, error general y acciones guardar/cancelar.
5. **Resumen en tarjeta:** icono o avatar, título, descripción, metadatos y contenido/acción delegada.
6. **Confirmación destructiva:** explicación comprensible, cancelar y confirmar con estado de envío.

## Auditoría inicial del repositorio

| Requisito | Situación encontrada |
|---|---|
| Inventario derivado de endpoints | Parcial: los endpoints están documentados, pero faltaba relacionarlos formalmente con pantallas. |
| Patrones repetidos | Parcial: existen `AppPage`, tarjetas y formularios, pero no hay catálogo documentado. |
| Tokens primitivos y semánticos | No cumple: `variables.css` contiene principalmente tokens semánticos y valores directos; no distingue ambos niveles. |
| Contraste WCAG 2.2 AA | No demostrado y con fallos visibles: por ejemplo, texto claro sobre el primario naranja no alcanza 4.5:1. |
| Tipografía, espaciado y radios | Parcial: hay tres radios; faltan tokens de escala tipográfica y una unidad base de espaciado. |
| Tokens centralizados | Parcial: el tema existe, pero quedan colores, sombras, radios y tamaños literales en CSS de páginas. |
| Tres componentes reutilizables | Parcial: `AppButton`, `AppInput` y `AppPage` son candidatos; sus interfaces y criterios no están documentados como catálogo. |
| Composición sin red ni rutas | Cumplimiento parcial comprobado en los componentes base actuales. |
| Cargando, vacío y error | Existen por separado, pero falta un componente compuesto que resuelva explícitamente los tres estados. |
| Traducción de errores API | Parcial: hay clases tipadas, pero falta una tabla única de mensajes por código/estado y pruebas de lenguaje comprensible. |
| Pantalla hecha solo con catálogo | No cumple: `Home` todavía compone elementos Ionic y bloques específicos directamente. |
| Áreas táctiles | Parcial: login declara 48 px; controles pequeños de rutinas no tienen evidencia de 44 × 44 CSS px. |
| Etiquetas semánticas | Parcialmente cubierto mediante `aria-label`, `aria-labelledby`, `aria-live` y elementos semánticos. |
| TalkBack/VoiceOver, dos anchos y fuente ampliada | No hay evidencia reproducible registrada. |

## Fundamentos del tema

### Colores

El tema declarará dos niveles:

- **Primitivos:** paleta sin significado de uso, por ejemplo `--pm-orange-700`, `--pm-violet-950`, `--pm-white`.
- **Semánticos:** intención de interfaz, por ejemplo `--pm-color-action-primary-bg`, `--pm-color-text-default`, `--pm-color-feedback-danger-text`. Todo token semántico referencia un primitivo.

Cada combinación real de primer plano/fondo se registrará con su relación calculada. Debe alcanzar, como mínimo:

- 4.5:1 para texto normal.
- 3:1 para texto grande (18 pt regular o 14 pt negrita) y componentes/indicadores gráficos necesarios.
- 7:1 se registrará como mejora cuando se alcance AAA, sin convertirlo en requisito de esta feature.

No se aprobará una combinación por inspección visual. Los estados normal, presionado, foco, deshabilitado, éxito y error se verifican en tema claro y oscuro.

### Tipografía

La escala propuesta usa `rem` para respetar el tamaño de fuente del sistema:

| Token | Tamaño | Uso |
|---|---:|---|
| `--pm-font-size-xs` | 0.75rem | Metadato no crítico |
| `--pm-font-size-sm` | 0.875rem | Ayuda y texto secundario |
| `--pm-font-size-md` | 1rem | Cuerpo y controles |
| `--pm-font-size-lg` | 1.25rem | Subtítulos |
| `--pm-font-size-xl` | 1.5rem | Títulos de sección |
| `--pm-font-size-2xl` | 2rem | Título de pantalla |

Los line-height semánticos serán 1.25 para títulos, 1.5 para cuerpo y 1.6 para texto de ayuda.

### Espaciado y radios

- Unidad base: `--pm-space-unit: 4px`.
- Escala: 1, 2, 3, 4, 6, 8 y 12 unidades (4, 8, 12, 16, 24, 32 y 48 px).
- Radios: `sm: 8px`, `md: 16px`, `lg: 24px`, `pill: 999px`.
- Área táctil mínima del proyecto: 44 × 44 CSS px. En Android se comprobará además el objetivo recomendado de 48 × 48 dp cuando el componente lo permita.

## Componentes candidatos y criterio

Se eligen por aparecer o ser necesarios en al menos tres pantallas, conservar la misma semántica y permitir variación mediante composición, sin incluir reglas de dominio.

### `AppButton`

Botón común para enviar formularios, reintentar, crear recursos y confirmar acciones.

```ts
interface AppButtonProps {
  children: ReactNode;                 // obligatorio: contenido delegado
  onClick?: MouseEventHandler;         // opcional: callback; Ionic también permite submit
  type?: 'button' | 'submit';          // default: 'button'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; // default: 'primary'
  isLoading?: boolean;                 // default: false
  disabled?: boolean;                  // default: false
  loadingLabel?: string;               // default: 'Procesando'
  accessibleLabel?: string;            // obligatorio si children no aporta texto visible
  expand?: 'block' | 'full';           // opcional
}
```

Devuelve eventos únicamente mediante callbacks; no navega ni ejecuta peticiones.

### `AppInput`

Campo compuesto para login, registro y formularios CRUD, integrable con React Hook Form.

```ts
interface AppInputProps {
  label: string;                       // obligatorio
  name: string;                        // obligatorio
  value?: string;                      // opcional
  type?: 'text' | 'email' | 'password' | 'search'; // default: 'text'
  placeholder?: string;                // opcional
  helperText?: string;                 // opcional
  error?: string;                      // opcional
  disabled?: boolean;                  // default: false
  required?: boolean;                  // default: false
  onValueChange?: (value: string) => void; // opcional
  endContent?: ReactNode;              // contenido delegado opcional
}
```

No valida reglas del backend; muestra el resultado de Zod/React Hook Form recibido por propiedades.

### `ResourceState`

Contenedor común para listas, detalles y paneles que resuelve cargando, vacío, error y éxito.

```ts
interface ResourceStateProps {
  status: 'loading' | 'empty' | 'error' | 'success'; // obligatorio
  children: ReactNode;                 // obligatorio: contenido de éxito
  emptyTitle?: string;                 // default: 'Todavía no hay elementos'
  emptyDescription?: string;           // opcional
  errorTitle?: string;                 // default: 'No pudimos cargar la información'
  errorDescription?: string;           // opcional, siempre comprensible
  onRetry?: () => void;                // opcional: callback de reintento
  loadingLabel?: string;               // default: 'Cargando información'
  action?: ReactNode;                  // contenido delegado para vacío/error
}
```

No conoce query keys, Axios, endpoints ni rutas. El padre traduce el estado de TanStack Query a su interfaz pública.

### `AppCard`

Superficie compuesta para resúmenes, filas adaptables y accesos, reutilizada por organizaciones, sedes, usuarios, roles y el panel.

```ts
interface AppCardProps {
  title: string;                       // obligatorio
  description?: string;                // opcional
  leading?: ReactNode;                 // contenido delegado opcional
  metadata?: ReactNode;                // contenido delegado opcional
  actions?: ReactNode;                 // contenido delegado opcional
  children?: ReactNode;                // contenido delegado opcional
  tone?: 'default' | 'highlight' | 'success' | 'warning'; // default: 'default'
}
```

## Traducción de errores

La capa de API conserva clases técnicas tipadas. Una función de presentación central traducirá los códigos reales sin mostrar mensajes técnicos crudos:

| HTTP / código | Mensaje base para usuario |
|---|---|
| 400 `VALIDATION_ERROR` | “Revisa los datos marcados e inténtalo nuevamente.” |
| 401 `UNAUTHORIZED` | “Tu sesión terminó. Inicia sesión nuevamente.” |
| 403 `FORBIDDEN` | “No tienes permiso para realizar esta acción.” |
| 404 `NOT_FOUND` | “No encontramos la información solicitada.” |
| 405 `METHOD_NOT_ALLOWED` | “Esta acción no está disponible.” |
| 409 `CONFLICT` | Mensaje de negocio seguro o “La información entra en conflicto con un registro existente.” |
| 500 `INTERNAL_ERROR` | “Ocurrió un problema en el servidor. Inténtalo más tarde.” |
| Red | “No pudimos conectarnos. Revisa tu conexión.” |
| Timeout | “La solicitud tardó demasiado. Inténtalo nuevamente.” |

## Pantalla de demostración

La pantalla real seleccionada será `Home`. Su estructura visual se ensamblará con `AppPage`, `AppCard`, `ResourceState`, `AppButton` y piezas de catálogo adicionales si son necesarias. `Home` podrá orquestar hooks, estado y callbacks, pero no dibujará controles o superficies equivalentes por fuera del catálogo.

## Criterios de aceptación

- [x] El inventario diferencia pantallas derivadas de endpoints verificados, bloqueadas y locales sin API.
- [x] Se documentan al menos tres patrones presentes en tres o más pantallas.
- [x] El tema distingue tokens primitivos y semánticos, y no quedan colores funcionales dispersos en componentes/páginas migrados.
- [x] Existe una matriz reproducible con todos los pares de color usados, ratios y resultado AA en claro y oscuro.
- [x] Ningún texto normal usa una combinación inferior a 4.5:1; componentes visuales y texto grande alcanzan 3:1.
- [x] La escala tipográfica usa `rem`, el espaciado parte de 4 px y todos los radios consumen tokens del tema.
- [x] Se documentan e implementan las interfaces públicas, obligatoriedad y defaults de al menos tres componentes.
- [x] Los componentes se implementan por composición y no importan servicios API, hooks de servidor ni router.
- [x] `ResourceState` cubre cargando, vacío, error con reintento y éxito mediante pruebas.
- [x] Los códigos reales de API se traducen a mensajes comprensibles mediante una función central probada.
- [x] `Home` se ensambla únicamente con componentes del catálogo para sus controles y patrones visuales reutilizables.
- [x] Todos los controles tienen un área mínima comprobable de 44 × 44 CSS px y nombre accesible.
- [x] Los controles sin texto visible poseen `aria-label` o un nombre accesible equivalente.
- [ ] Se registra evidencia manual de recorrido con TalkBack en Android; VoiceOver se registra si hay un dispositivo iOS disponible.
- [x] Se registra evidencia a 320 px y 768 px, y con fuente del sistema ampliada al menos al 200 %, sin pérdida de contenido ni funcionalidad.
- [x] `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build` y `yarn cap:sync` finalizan correctamente.

## Fuera de alcance

- Implementar CRUD de usuarios mientras persista el defecto de permisos documentado.
- Inventar endpoints para rutinas, recompensas o reportes.
- Modificar el backend.
- Crear todas las pantallas futuras del inventario; el inventario guía el sistema de diseño, mientras esta feature demuestra su uso en una pantalla real.

## Resultado de implementación

Implementada el 2026-08-30. El tema distingue primitivas `--pm-*` de tokens semánticos `--pm-color-*`, incorpora escala tipográfica en `rem`, ritmo espacial de 4 px, radios y objetivo táctil. Los 14 pares funcionales documentados alcanzan AA, con un mínimo de 5.89:1.

Se implementaron y documentaron `AppButton`, `AppInput`, `AppCard` y `ResourceState`; ninguno importa servicios HTTP, TanStack Query o router. `Home` usa el catálogo para tarjetas, estados y controles. El traductor central de errores evita exponer detalles técnicos.

Validación automática completada: lint, TypeScript, 33 pruebas, build, Capacitor sync y APK Android. En `docs/accessibility/` quedan capturas reales del emulador a 320 y 768 CSS px, fuente del sistema al 200 % y el árbol expuesto al activar TalkBack. Falta únicamente que una persona complete y registre el recorrido auditivo por gestos con TalkBack; no se declara esa comprobación humana como realizada automáticamente.
