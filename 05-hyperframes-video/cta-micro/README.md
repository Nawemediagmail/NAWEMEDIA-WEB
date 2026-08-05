# cta-micro

Séptima y última pieza de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames
completo, listo para re-renderizar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 4s, 840 KB. El botón **"Ver cotización →"**
  — el copy real del CTA visto en la captura de `../demo-preview` — con el gradiente de marca
  (`gradients.btn`, la única superficie con gradiente pleno según `frame.md` → componente
  `cta-button`). Respiración idle continua, un cursor sintético se acerca, presiona, suelta con
  overshoot y un ripple confirma el click, y el botón vuelve a respirar.

## Ajustes durante el build

- El botón usaba un "escenario" de 1×1px + centrado por porcentaje para posicionar sus hijos;
  el linter de layout lo marcó como `escaped_container` (coordenadas calculadas fuera de su
  contenedor real). Se cambió a un contenedor a tamaño completo (mismo patrón que `#glow` en
  las otras piezas), eliminando el warning sin perder el centrado.
- La respiración idle (`scale`, loop) y la secuencia de press/release competían por la misma
  propiedad `scale` al mismo tiempo (`overlapping_gsap_tweens`). Se resolvió partiendo la
  respiración en dos tramos finitos que ceden el control de `scale` durante la ventana exacta
  del click, en vez de correr en paralelo.

## Verificación

`hyperframes check`: 0 errores, contraste WCAG AA 8/8.

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```
