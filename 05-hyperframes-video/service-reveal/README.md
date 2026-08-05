# service-reveal

Segunda pieza de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames completo,
listo para re-renderizar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 8s, 1.3 MB. Eyebrow + headline ("Cinco
  líneas. Un solo look.") seguido de las 5 líneas de servicio (`window.NW.CATALOG` en
  `nw-tokens.js`: Redes, Eventos, Visuales LED, Campaña completa, Personalizado) cascadeando
  izquierda→derecha, cada card con el gradiente **real** de su categoría (no un ciclo de hues
  inventado — son los gradientes que ya usa `nawemedia-presupuesto-v6` en producción).
- **`index.html`** — la composición.
- Título/desc de cada card son el texto real de `window.NW.CATALOG`, no copy inventado.

## Verificación

`hyperframes check`: 0 errores, contraste WCAG AA 50/50.

## Bug encontrado y corregido durante el build

El `.clip` (`#scene`) no tenía `width`/`height` explícitos, así que el `height: 100%` de
`.scene-content` no resolvía contra nada y el contenido no quedaba centrado verticalmente
(quedaba pegado arriba). Fix: `#scene { position: relative; width: 100%; height: 100%; }`.
Vale la pena revisar si `hero-kinetic-type/index.html` tiene el mismo patrón la próxima vez que
se edite — ahí no se notó porque el contenido está anclado arriba por diseño.

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```
