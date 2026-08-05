# 05-hyperframes-video

Design system para las piezas de video/animación del index de nawemeddia.com, generadas con
los skills de HyperFrames instalados en `04-notas-tecnicas/hyperframes-video.md`.

| Archivo | Contenido |
|---|---|
| [`frame.md`](frame.md) | Frame-scale design spec (colores, tipografía, componentes) — tokens copiados verbatim de `nw-tokens.js` (`nawemedia-presupuesto-v6`), tipografía nueva para video (League Gothic + JetBrains Mono) |
| [`hero-kinetic-type/`](hero-kinetic-type/) | Primera pieza construida y renderizada (MP4 7s) — proyecto HyperFrames completo, listo para re-render |

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
| 2 | Scroll reveal de servicios | Pendiente |
| 3 | Stat/chart animado | Pendiente |
| 4 | Transición flash retinteada | Pendiente |
| 5 | Demo preview embebido | Pendiente |
| 6 | Lower-thirds de clientes | Pendiente |
| 7 | Micro-interacción del CTA | Pendiente |
