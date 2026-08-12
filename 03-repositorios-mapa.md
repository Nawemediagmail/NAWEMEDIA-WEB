# Mapa de repositorios GitHub (org Nawemediagmail)

> Última actualización: 2026-08-12 (re-relevado contra la org completa vía API, 19 repos detectados).

## `NAWEMEDIA-WEB` (este repo)

Dejó de ser sólo inventario: bajo `sitio/` ya vive el sitio institucional en producción
(`nawemedia.com`, desplegado en Vercel) — hero, servicios, demos embebidos, sección de reels,
cotizador de presupuesto embebido, herramienta privada `/admin-facturas` (PWA, PayPal live,
historial en Cloudflare KV) y landing puntual `fiestasoops_29ago`. El README todavía dice
"este repo NO es el sitio web todavía"; eso ya no es así y conviene corregirlo.

## En scope de esta sesión (leídos en detalle)

| Repo | Rama default | Usar para |
|---|---|---|
| `nawemedia-presupuesto-v6` | `nawemedia` | Motor de presupuestos a embeber en la web ⭐ (ya embebido en `sitio/presupuesto`) |
| `presupuesto-os-nawemedia` | `main` | Referencia histórica — no usar para producción |
| `PRESUPUESTO-OS_V4` | `main` | Referencia histórica — no usar para producción |
| `nawemedia_presupuesto-os_v4.1` | `main` | Referencia histórica — no usar para producción |
| `nawemedia-catalopg-os-v5` | `nawemedia` | Servicio de catálogo + material de diseño (mockup V7) |
| `nawemedia-epks` | `main` | Portfolio de EPKs + sistema para dar de alta nuevos DJs (repo activo, push 2026-07-21) |
| `nawemedia-onboarding` | `main` | Base para el flujo de "nuevo cliente" en la web |
| `NAWEMEDIA_REPO_1` | `main` | Boilerplate Next.js + artefactos de ClubOS (separar) |

## Detectados en la org pero fuera de scope de esta sesión
(agregar con `add_repo` si se necesita inventariar el contenido)

- `dj-epk-template` — plantilla base de EPK (vanilla JS + Supabase + Vercel)
- `dj-nawel-demo-epk`, `dj-ambarlombardi-epk`, `sofi-epk-app`, `PRESS-KIT-WEB-RONALD-ROSSENOUFF` — EPKs de clientes puntuales
- `creadores`, `miculka-test-01`, `miculka-logistica`, `REEL_2_POST` — proyectos de clientes fuera del rubro música/EPK
- `ui-ux-pro-max-skill` — **nuevo desde el último relevamiento**: fork público, no es contenido propio de NAWEMEDIA (skill de terceros), no aplica al inventario de producto

## Duplicación detectada (para limpiar más adelante)
Varios repos comparten literalmente el mismo `package.json` base (`"name": "presupuesto-os"`,
mismas dependencias Vite/React/TS): `PRESUPUESTO-OS_V4`, `nawemedia_presupuesto-os_v4.1`,
`presupuesto-os-nawemedia` y `nawemedia-catalopg-os-v5`. Son forks/copias del mismo
boilerplate inicial, cada uno evolucionado en distinta dirección. Vale la pena, en algún
momento, decidir cuáles archivar.
