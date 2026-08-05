# 05-hyperframes-video

Design system para las piezas de video/animación del index de nawemeddia.com, generadas con
los skills de HyperFrames instalados en `04-notas-tecnicas/hyperframes-video.md`.

| Archivo | Contenido |
|---|---|
| [`frame.md`](frame.md) | Frame-scale design spec (colores, tipografía, componentes) — tokens copiados verbatim de `nw-tokens.js` (`nawemedia-presupuesto-v6`), tipografía nueva para video (League Gothic + JetBrains Mono) |
| [`hero-kinetic-type/`](hero-kinetic-type/) | Primera pieza construida y renderizada (MP4 7s) — proyecto HyperFrames completo, listo para re-render |
| [`service-reveal/`](service-reveal/) | Segunda pieza construida y renderizada (MP4 8s) — 5 cards de servicio con los gradientes reales de `nw-tokens.js` |
| [`stat-chart/`](stat-chart/) | Tercera pieza construida y renderizada (MP4 7s) — 3 stats reales con count-up seek-safe |
| [`transition-flash/`](transition-flash/) | Cuarta pieza construida y renderizada (MP4 4s) — transición real entre las piezas 1 y 2, shader retinteado |
| [`demo-preview/`](demo-preview/) | Quinta pieza construida y renderizada (MP4 7s) — captura real del motor de presupuestos + cursor sintético |
| [`lower-thirds/`](lower-thirds/) | Sexta pieza construida y renderizada (MP4 8s) — los 6 DJs reales con EPK activo, sin testimonios inventados |
| [`cta-micro/`](cta-micro/) | Séptima y última pieza construida y renderizada (MP4 4s) — micro-interacción del botón "Ver cotización" real |

## Cómo se usa

Cuando se arranque el proyecto real de HyperFrames (`npx hyperframes init`), copiar este
`frame.md` a la raíz de ese proyecto — el CLI y los skills lo detectan automáticamente
(precedencia `frame.md` → `design.md` → `DESIGN.md`) y lo tratan como fuente de verdad de marca
para cualquier composición que se genere ahí.

Este repo (`NAWEMEDIA-WEB`) es un inventario, no el proyecto de video en sí — este archivo es
el entregable de la etapa de dirección creativa, listo para handoff al repo que termine
construyendo las piezas.

## Piezas de animación propuestas para el index

Ver la lista completa discutida en sesión (hero kinetic type, scroll reveal de servicios,
stat/chart animado, transición flash retinteada, demo preview embebido, lower-thirds de
clientes, micro-interacción del CTA). Cada una mapea a un componente de `frame.md`.

| # | Pieza | Estado |
|---|---|---|
| 1 | Hero kinetic type | ✅ construida — [`hero-kinetic-type/`](hero-kinetic-type/) |
| 2 | Scroll reveal de servicios | ✅ construida — [`service-reveal/`](service-reveal/) |
| 3 | Stat/chart animado | ✅ construida — [`stat-chart/`](stat-chart/) |
| 4 | Transición flash retinteada | ✅ construida — [`transition-flash/`](transition-flash/) |
| 5 | Demo preview embebido | ✅ construida — [`demo-preview/`](demo-preview/) |
| 6 | Lower-thirds de clientes | ✅ construida — [`lower-thirds/`](lower-thirds/) |
| 7 | Micro-interacción del CTA | ✅ construida — [`cta-micro/`](cta-micro/) |

**Las 7 piezas están construidas y renderizadas.** Cada carpeta es un proyecto HyperFrames
independiente y re-renderizable (`npx hyperframes render . -q high -o ./renders/video.mp4`).
Todas comparten `frame.md` como fuente de marca y, donde fue posible, contenido real verificado
contra `nw-tokens.js`, el inventario, o el producto en vivo — nunca copy o cifras inventadas.
Siguiente paso natural: llevar estos MP4/composiciones al proyecto real de `nawemeddia.com`
cuando exista.
