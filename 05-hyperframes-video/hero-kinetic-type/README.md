# hero-kinetic-type

Primera pieza construida de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames
completo (categoría `kinetic-type`, workflow `motion-graphics`), listo para re-renderizar o
editar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 7s, 1.7 MB. Logo-mark (triángulo real de
  marca) entra, "NAWEMEDIA" slama en League Gothic con gradiente en "WE", regla estructural,
  eyebrow en JetBrains Mono. Fondo con glow radial + triángulo fantasma respirando en loop —
  pensado para embeber/loopear en el hero del index.
- **`index.html`** — la composición (contrato HyperFrames: timeline GSAP pausado, seek-safe).
- **`vendor/gsap.min.js`** — GSAP vendorizado localmente (evita depender de CDN en el render).
- **`shot-plan.json`** — el IR de la pieza (categoría, paleta, fuente, beats).
- **`snapshots/contact-sheet.jpg`** — proof sheet en 0s / 0.5s / 1.3s / 4s.

## Verificación

`hyperframes check` pasó: 0 errores, contraste WCAG AA 9/9. El único warning es intencional
(`gsap_infinite_repeat` — el breathing del fondo usa `repeat:-1` a propósito, dentro de una
duración finita de 7s, para que el loop del player no se note).

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```

## Nota de fidelidad de marca

Durante el build se detectó que `nawemedia-presupuesto-v6` sí usa un webfont custom (**Sora**,
400–800) — el `frame.md` original decía "solo system font", corregido. También se confirmó el
isotipo real (triángulo/play-button del loading splash) y se usó su geometría exacta acá en vez
de inventar una forma. Ver "Known Gaps" en `../frame.md` para el detalle.

## Fix post-review (layout)

Una revisión de PR encontró que `#scene` (el `.clip` interno) no tenía `width`/`height`
explícitos — el mismo bug de centrado documentado en `../service-reveal/README.md`, que nunca
se había vuelto a aplicar acá. `justify-content: center` no hacía nada porque el `height: 100%`
de `.scene-content` no resolvía contra nada. Corregido con la misma regla que usan las otras 6
piezas (`#scene { position: relative; width: 100%; height: 100%; }`) y vuelto a renderizar — el
contenido ahora sí queda centrado verticalmente. Como `../transition-flash` usa el frame final
de esta pieza como textura, también se actualizó y re-renderizó esa pieza en cascada.
