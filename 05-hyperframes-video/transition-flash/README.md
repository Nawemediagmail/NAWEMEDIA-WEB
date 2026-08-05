# transition-flash

Cuarta pieza de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames completo,
listo para re-renderizar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 4s, 612 KB. La transición **real** entre
  la pieza 1 (`../hero-kinetic-type`) y la pieza 2 (`../service-reveal`) — no un demo genérico.
- **Assets**: `assets/scene-a-hero.png` / `assets/scene-b-services.png` son los frames finales
  reales de esas dos piezas (`hero-kinetic-type/snapshots/frame-03-at-4s.png` y
  `service-reveal/snapshots/frame-03-at-7s.png`), usados como texturas WebGL — no un mockup,
  es pixel-perfect a lo que ya está construido.
- **Shader**: `flash-through-white` del catálogo HyperFrames, adaptado y **retinteado**: el pico
  del flash es `rgb(255, 219, 240)` (magenta pálido) en vez de blanco puro — así el corte lee
  como marca, no como stock (`frame.md` → componente `transition-flash`).

## Por qué no se reusó el bloque del catálogo tal cual

`flash-through-white` (la versión del catálogo) rasteriza el DOM en vivo con `canvas.fillRect`/
`fillText` — no soporta gradientes (`background-image`) ni SVG, así que el wordmark con
gradiente, los swatches y el logo-mark hubieran salido en blanco. En vez de reescribir ese
rasterizador, se reusó únicamente la parte que sí es 100% reusable — el **shader GLSL** del
crossfade-a-blanco — sobre dos PNGs reales ya renderizados por `hyperframes snapshot`. Mismo
efecto, fidelidad exacta.

## Verificación

`hyperframes check`: 0 errores, 0 warnings.

## Fix post-review

`assets/scene-a-hero.png` se regeneró después de que un fix de layout en `../hero-kinetic-type`
(ver su README) cambiara el frame final de esa pieza — el asset y el render de esta pieza
estaban desactualizados respecto al hero corregido. Vuelto a capturar y re-renderizar para que
la transición siga siendo pixel-perfect al hero real.

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```
