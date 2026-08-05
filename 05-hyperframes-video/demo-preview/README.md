# demo-preview

Quinta pieza de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames completo,
listo para re-renderizar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 7s, 2.1 MB. Bezel minimalista (`demo-frame`
  de `frame.md`) con una captura **real** del motor de presupuestos corriendo en vivo — no un
  mockup — Ken Burns lento + un cursor sintético que viaja hasta la card "Reels Promocionales"
  real y hace click (ping de confirmación).
- **`assets/presupuesto-app.png`** — screenshot real de `nawemedia-presupuesto-v6` corriendo,
  capturado sirviendo el `index.html` del repo localmente (`python3 -m http.server`) y
  fotografiándolo con Playwright/Chromium a 1920×1080. La app compila con Babel en el navegador,
  así que basta con abrirla — no requiere build.

## Por qué una captura real y no un mockup

`frame.md` (componente `demo-frame`): "la UI del producto es el contenido, el frame solo señala
'esto es software'". Un mockup inventado hubiera sido más rápido pero menos persuasivo — y
menos verificable. La captura real confirma además cosas que no estaban documentadas: el logo
real es el mismo triángulo/play-button que ya usamos en `hero-kinetic-type` (coincide
exactamente), y el catálogo de servicios visible en la UI difiere del `window.NW.CATALOG` de
`nw-tokens.js` usado en `service-reveal` (acá dice "Diseño de Carátula/Cover", "Diseño de
Logotipo", "Reels Promocionales", "Visuales 3D Pantalla LED", "Producción Musical & Mastering",
"Personalizado" — probablemente una versión más nueva del catálogo). Vale la pena señalarlo al
equipo de NAWEMEDIA antes de publicar cualquier copy de servicios en el sitio institucional.

## Verificación

`hyperframes check`: 0 errores. Un `container_overflow` (el Ken Burns del screenshot y su
contenedor exceden ligeramente los bordes del bezel por diseño) marcado con
`data-layout-allow-overflow="true"` — clip real garantizado por `overflow: hidden` en `#bezel`.

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```
