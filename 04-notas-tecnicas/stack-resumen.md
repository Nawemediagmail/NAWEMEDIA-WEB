# Stack técnico detectado (para decidir el stack del sitio institucional)

| Área | Stack usado hoy |
|---|---|
| EPKs de DJs | HTML/CSS/JS estático + Vercel + Supabase (Edge Functions) |
| Onboarding | Next.js 16 + React 19 + Tailwind 4 + Framer Motion + Supabase |
| Presupuestos (v6) | React (JSX sueltos, sin bundler visible) + design tokens propios |
| Presupuestos (v4/v4.1/intermedia) | Vite + React + TypeScript |
| Catálogo (v5) | Vite + React + TypeScript + html2canvas |
| ClubOS | Automatización Make/Integromat + SQL (Supabase) |
| Hosting usado | Vercel (EPKs, onboarding), Netlify (demos varias) |
| Base de datos / backend | Supabase en casi todos los productos activos |

## Recomendación para nawemeddia.com
Dado que Supabase es el backend común y Vercel/Netlify ya están en uso, lo más simple es
**no sumar una tecnología nueva** solo para el sitio institucional:
- Next.js + Tailwind (mismo patrón que `nawemedia-onboarding`) si el sitio necesita alguna
  lógica de servidor (formularios, envío de leads, panel admin).
- O HTML/CSS/JS estático + Vercel (mismo patrón que los EPKs) si el sitio es
  mayormente contenido estático con el motor de presupuestos embebido.

La decisión entre ambas depende de si "Presupuestos" se migra como componente React
dentro del mismo proyecto, o se deja como iframe apuntando al deploy de
`nawemedia-presupuesto-v6`.
