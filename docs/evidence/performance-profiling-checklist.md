# Perfilado de rendimiento en dispositivo físico — guía para ejecutar

**No ejecutable por un agente de código**: requiere un teléfono Android o iPhone físico conectado, en modo de perfilado (release/profile build), nunca el emulador ni el modo de depuración (el debugger añade su propio overhead y falsea la medición).

## 1. Preparar el build

```bash
yarn build
yarn cap:sync
```

- Android: `yarn android` → en Android Studio, ejecutar con **Profile** (no *Run*/*Debug*) sobre un dispositivo físico conectado por USB con depuración habilitada.
- iOS: `yarn ios` → en Xcode, `Product > Profile` (abre Instruments) sobre un iPhone físico, esquema **Release**.

## 2. Medir antes de tocar nada

1. Abre la pantalla más pesada de la app (candidatos: `Mis rutinas` con varias tarjetas, o `Home` con las secciones de progreso/reporte).
2. Interactúa como lo haría una persona real: desplázate, cambia de pestaña, crea una rutina.
3. En Android Studio Profiler: pestaña **CPU** → busca caídas de FPS o "Choreographer skipped frames" en Logcat. En Xcode Instruments: usa la plantilla **Time Profiler** o **Animation Hitches**.

## 3. Identificar el hilo antes de corregir nada

Antes de tocar código, confirma **cuál** hilo excede su presupuesto (16 ms por frame a 60 fps):

- **Hilo de interfaz (main/UI thread)**: trabajo de layout, medición de vistas, o JavaScript síncrono pesado en el WebView (ej. un cálculo grande en un render de React). Se ve como "Choreographer: Skipped frames" con `Input`/`Animation`/`Traversal` largos en Android, o barras altas en el track **Main Thread** de Instruments.
- **Hilo de trazado (RenderThread/GPU, "raster")**: el layout ya se calculó rápido, pero dibujar/rasterizar la capa es lento (sombras, blur, imágenes grandes sin redimensionar, demasiadas capas superpuestas). Se ve en el track **RenderThread** (Android) o **GPU tracks** de Instruments.

No apliques ninguna corrección hasta tener esta respuesta — optimizar el hilo equivocado no mejora nada.

## 4. Corregir un problema de fluidez y remedir

Ejemplos de correcciones típicas según el hilo:

- **UI thread lento**: mover cálculo pesado fuera del render (memoización con `useMemo`/`React.memo`), reducir el número de nodos DOM por tarjeta, evitar recalcular listas completas en cada tecla de un input controlado.
- **Raster/GPU lento**: reducir sombras/`box-shadow` costosas en listas largas, comprimir/redimensionar imágenes de evidencia de rutinas antes de mostrarlas (`RoutineDetailPage` ya evita esto al no auto-guardar en galería, pero revisa el tamaño real de archivo mostrado).

Tras aplicar **una sola** corrección, repite el paso 2 en el mismo dispositivo y compara el mismo escenario (mismos frames, misma interacción) para confirmar la mejora numérica (menos frames saltados, menor tiempo en el hilo identificado).

## 5. Registrar el resultado aquí

> Pendiente — completar esta sección con: dispositivo usado, hilo identificado, corrección aplicada (commit/archivo), métrica antes/después.
