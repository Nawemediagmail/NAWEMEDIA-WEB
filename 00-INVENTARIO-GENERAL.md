# Inventario general

Relevado el 2026-07-15 directamente desde GitHub (org `Nawemediagmail`) y Netlify.

## Repositorios GitHub

| Repo | Visibilidad | Stack | Qué es | Estado / notas |
|---|---|---|---|---|
| `nawemedia-presupuesto-v6` | público | React (JSX suelto) + `index.html` monolítico (11MB) | Sistema de presupuestos interactivo, versión más reciente (may. 2026) | **Candidato a embeber en la web.** Incluye `nw-tokens.js` (design tokens), `nw-components.jsx`, `tweaks-panel.jsx` (panel de ajustes en vivo) |
| `presupuesto-os-nawemedia` | privado | Vite + React + TS | Versión intermedia del sistema de presupuestos | Antecesor de v6, mismo `package.json` base (`presupuesto-os`) |
| `PRESUPUESTO-OS_V4` | público | Vite + React + TS | Primera versión pública del sistema de presupuestos | Base histórica, superada por v6 |
| `nawemedia_presupuesto-os_v4.1` | público | Vite + React + TS | Iteración v4→v4.1 | Puente entre V4 y v6, poco diferenciada |
| `nawemedia-catalopg-os-v5` | público | Vite + React + TS, `html2canvas` | Catálogo automático de productos/servicios | Incluye mockup visual (`designMOCKUP_V7.png`) y brief de rediseño UI. **Ojo:** su `package.json` se llama `presupuesto-os` (bootstrapped desde el proyecto de presupuestos, no renombrado) |
| `nawemedia-epks` | público | HTML/CSS/JS estático + Vercel + Supabase (Edge Functions) | Monorepo de Electronic Press Kits para DJs | Sistema activo con template, script `new-dj.sh`, admin panel (Ctrl+Alt+A, pass `demo2026`). DJs cargados: Ambar Lombardi, YEMIX, DJ BINI, DJ Fay, DJ Mario Beckam, DJ Elektra |
| `nawemedia-onboarding` | público | Next.js 16 + React 19 + Supabase + Tailwind + Framer Motion | App de onboarding de clientes | `package.json` interno dice `sofi-epk-app` (nombre heredado de otro proyecto, no renombrado) |
| `NAWEMEDIA_REPO_1` | público | Next.js + Supabase | "Repo basic V1" — contiene además blueprints de **ClubOS** (`clubos_blueprint.json`, `clubos_schema.sql`, `clubos_seed.json`, flujo de compra en Make/Integromat) | Mezcla de boilerplate + un producto distinto (gestión de clubes/venta de entradas) sin documentar aparte |

### Fuera de scope de esta sesión (existen, pero no soy pude leerlos en este repo de inventario)
Detectados por búsqueda en la org, requieren agregarse a la sesión si se quieren inventariar en detalle:
- `dj-epk-template` — plantilla EPK base (vanilla JS + Supabase + Vercel)
- `dj-nawel-demo-epk`, `dj-ambarlombardi-epk`, `sofi-epk-app`, `PRESS-KIT-WEB-RONALD-ROSSENOUFF` — EPKs de clientes individuales
- `nawemedia-catalopg-os-v5` usa rama por defecto `nawemedia` (no `main`) — igual que `dj-nawel-demo-epk` y `nawemedia-presupuesto-v6`
- `miculka-logistica`, `savori...` (`creadores`, `miculka-test-01`) — proyectos de clientes fuera del rubro música

## Sitios Netlify (equipo activo, plan dev)

| Sitio | URL | Uso probable |
|---|---|---|
| `electronic-press-kit-demo` | http://electronic-press-kit-demo.netlify.app | Demo de EPK — candidato directo para sección "Demos" |
| `savori-a-pedidoshub` | http://savori-a-pedidoshub.netlify.app | Proyecto de cliente (pedidos/hub) |
| `benevolent-custard-53650f` | https://benevolent-custard-53650f.netlify.app | Nombre autogenerado — verificar contenido antes de publicar |
| `benevolent-salamander-422abd` | http://benevolent-salamander-422abd.netlify.app | Nombre autogenerado — verificar contenido antes de publicar |

> Acción pendiente: entrar a cada URL, confirmar qué muestra realmente y renombrar los sitios con nombre autogenerado si se van a linkear desde la web pública.
