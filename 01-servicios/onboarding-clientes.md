# Servicio: Onboarding de clientes

## Qué es
App de onboarding para nuevos clientes de la agencia (probablemente el formulario/flujo
inicial que reemplaza al intake manual).

## Repo
`nawemedia-onboarding` (público). Stack: Next.js 16 + React 19 + Supabase + Tailwind 4 + Framer Motion.

## Nota
El `package.json` interno dice `"name": "sofi-epk-app"` — heredado de un proyecto de EPK
de cliente (Sofi), no renombrado. Confirmar si el código es realmente genérico para
onboarding o todavía tiene lógica específica de ese EPK antes de reusarlo.

## Relación con EPKs
Ver también `nawemedia-epks/NAWEMEDIA_EPK_INTAKE.md` (formulario de intake) y
`NAWEMEDIA_EPK_SYSTEM.md` (documentación técnica completa del sistema de EPKs) —
probablemente el onboarding de un DJ nuevo pasa por ahí antes de tocar este repo.

## Para la web
Puede ser la base del futuro formulario "Empezar un proyecto" / "Solicitar presupuesto"
si se decide no embeber directamente el motor de presupuestos.
