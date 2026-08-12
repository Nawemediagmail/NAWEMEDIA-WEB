# NAWEMEDIA-WEB — Inventario y material fuente para nawemeddia.com

Arrancó como inventario ordenado de todo lo que NAWEMEDIA ya construyó (servicios, demos,
sistema de presupuestos, catálogos, EPKs, etc.) y ahora también aloja el sitio institucional
en producción, bajo [`sitio/`](sitio) — desplegado en `nawemedia.com` vía Vercel.

Dominio comprado: **www.nawemeddia.com**

## Cómo está organizado

| Carpeta | Contenido |
|---|---|
| [`sitio/`](sitio) | El sitio institucional real, en producción (`nawemedia.com`) |
| [`00-INVENTARIO-GENERAL.md`](00-INVENTARIO-GENERAL.md) | Tabla maestra: todo repo + todo sitio Netlify, qué es, estado, para qué sirve en la web |
| [`01-servicios/`](01-servicios) | Una ficha por línea de servicio de la agencia (EPKs, Presupuestos, Catálogos, ClubOS, Onboarding) |
| [`02-demos-portfolio/`](02-demos-portfolio) | Demos en vivo (Netlify) y EPKs de clientes activos, listos para linkear/embeber en la sección "Demos" |
| [`03-repositorios-mapa.md`](03-repositorios-mapa.md) | Mapa de todos los repos de GitHub, qué versión de cada sistema usar y cuáles son obsoletas |
| [`04-notas-tecnicas/stack-resumen.md`](04-notas-tecnicas/stack-resumen.md) | Stack técnico real detectado en cada repo (para decidir el stack del sitio institucional) |
| [`04-notas-tecnicas/hyperframes-video.md`](04-notas-tecnicas/hyperframes-video.md) | HyperFrames (heygen-com), motor de video HTML-nativo instalado como skill de agente — para generar videos demo/promo |
| [`05-hyperframes-video/frame.md`](05-hyperframes-video/frame.md) | Design spec (frame.md) para las piezas de animación del index — colores/tipografía verbatim de `nw-tokens.js` + tipografía nueva para video |

## Próximo paso sugerido

Con este inventario armado, el siguiente movimiento es maquetar `nawemeddia.com` con:
- **Home** con las 4-5 líneas de servicio
- **Demos** embebiendo los sitios Netlify + EPKs de clientes ya vivos
- **Presupuestos** embebiendo el motor de `nawemedia-presupuesto-v6` (la versión más madura)
- **Servicios** con una ficha por línea (ver `01-servicios/`)
