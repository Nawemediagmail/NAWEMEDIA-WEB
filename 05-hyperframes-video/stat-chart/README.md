# stat-chart

Tercera pieza de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames completo,
listo para re-renderizar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 7s, 1.1 MB. Eyebrow + headline ("Lo que ya
  construimos.") seguido de 3 stat-tiles con count-up + barra de fill sincronizada:
  - **6** — EPKs de DJs activos (conteo real de `00-INVENTARIO-GENERAL.md`: Ambar Lombardi,
    YEMIX, DJ BINI, DJ Fay, DJ Mario Beckam, DJ Elektra)
  - **16** — Servicios en el catálogo (conteo real de `window.NW.CATALOG` en `nw-tokens.js`:
    5 Redes + 4 Eventos + 4 Visuales LED + 3 Campaña completa)
  - **20%** — Descuento máximo (cupón real `GRANDE20` en `window.NW.COUPONS`)

Los tres números están verificados contra las fuentes reales del inventario/`nawemedia-presupuesto-v6`
— ninguno es inventado (regla dura de `frame.md`: "Numerals & Claims").

## Determinismo del count-up

Cada número usa un tween sobre un objeto proxy (`{n: 0}` → `onUpdate` escribe `textContent`),
no un contador basado en wall-clock — seek-safe. Verificado con una captura a mitad de la
animación (`1.3s`): muestra `5 / 8 / 2%`, no `0` ni el valor final, confirmando que el timeline
pausado se puede seekear a cualquier punto sin romper el conteo.

## Verificación

`hyperframes check`: 0 errores, contraste WCAG AA 33/33.

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```
