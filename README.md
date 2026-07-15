# NAWEMEDIA-WEB — Inventario y material fuente para nawemeddia.com

Este repo NO es el sitio web todavía. Es el punto de partida: un inventario ordenado
de todo lo que NAWEMEDIA ya construyó y que puede alimentar nawemeddia.com
(servicios, demos, sistema de presupuestos, catálogos, EPKs, etc.).

Dominio comprado: **www.nawemeddia.com**

## Cómo está organizado

| Carpeta | Contenido |
|---|---|
| [`00-INVENTARIO-GENERAL.md`](00-INVENTARIO-GENERAL.md) | Tabla maestra: todo repo + todo sitio Netlify, qué es, estado, para qué sirve en la web |
| [`01-servicios/`](01-servicios) | Una ficha por línea de servicio de la agencia (EPKs, Presupuestos, Catálogos, ClubOS, Onboarding) |
| [`02-demos-portfolio/`](02-demos-portfolio) | Demos en vivo (Netlify) y EPKs de clientes activos, listos para linkear/embeber en la sección "Demos" |
| [`03-repositorios-mapa.md`](03-repositorios-mapa.md) | Mapa de todos los repos de GitHub, qué versión de cada sistema usar y cuáles son obsoletas |
| [`04-notas-tecnicas/stack-resumen.md`](04-notas-tecnicas/stack-resumen.md) | Stack técnico real detectado en cada repo (para decidir el stack del sitio institucional) |

## Próximo paso sugerido

Con este inventario armado, el siguiente movimiento es maquetar `nawemeddia.com` con:
- **Home** con las 4-5 líneas de servicio
- **Demos** embebiendo los sitios Netlify + EPKs de clientes ya vivos
- **Presupuestos** embebiendo el motor de `nawemedia-presupuesto-v6` (la versión más madura)
- **Servicios** con una ficha por línea (ver `01-servicios/`)
