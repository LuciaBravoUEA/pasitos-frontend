# Evidencia de contraste · WCAG 2.2 AA

Fecha: 2026-08-30. Los valores se calculan con la luminancia relativa definida por WCAG mediante `node scripts/check-contrast.mjs`. La exigencia aplicada es 4.5:1 para texto normal, más estricta que 3:1 para texto grande y límites de componentes.

| Uso | Primer plano | Fondo | Relación | AA |
|---|---:|---:|---:|---|
| Acción primaria clara | `#ffffff` | `#914600` | 6.82:1 | Cumple |
| Texto principal claro | `#2d2540` | `#fffaf4` | 13.95:1 | Cumple |
| Texto secundario claro | `#645b78` | `#ffffff` | 6.35:1 | Cumple |
| Marca clara | `#914600` | `#ffffff` | 6.82:1 | Cumple |
| Error claro | `#b4232f` | `#fff0f1` | 5.89:1 | Cumple |
| Éxito claro | `#176b32` | `#f1fff4` | 6.39:1 | Cumple |
| Recompensa clara | `#765000` | `#fff5d6` | 6.61:1 | Cumple |
| Acción primaria oscura | `#1f1930` | `#ffd19a` | 11.97:1 | Cumple |
| Texto principal oscuro | `#fdf7ed` | `#1f1930` | 15.89:1 | Cumple |
| Texto secundario oscuro | `#d7cddf` | `#2b2340` | 9.66:1 | Cumple |
| Marca oscura | `#ffd48a` | `#1f1930` | 12.13:1 | Cumple |
| Error oscuro | `#ffb4bb` | `#411f25` | 8.63:1 | Cumple |
| Éxito oscuro | `#a7e9b9` | `#173a24` | 9.00:1 | Cumple |
| Recompensa oscura | `#ffe08a` | `#493915` | 8.66:1 | Cumple |

El naranja `#ff9f43` permanece como acento decorativo y no se usa como fondo de texto claro. El fondo de acción se cambió a `#914600` en tema claro.

## Evidencia manual pendiente

La inspección con TalkBack, fuente del sistema al 200 % y capturas a 320/768 px debe completarse en el emulador. No se marca como realizada hasta recorrer la pantalla realmente.
