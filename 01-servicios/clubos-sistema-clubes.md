# Servicio: ClubOS — Sistema de gestión/venta para clubes

## Qué es
Un producto distinto a los otros tres (EPKs, presupuestos, catálogos): automatización del
**flujo de compra de entradas/consumiciones para clubes/discotecas**.

## Dónde vive
Dentro de `NAWEMEDIA_REPO_1` ("Repo basic V1"), mezclado con boilerplate de Next.js:
- `ClubOS - Flujo de Compra.blueprint.json` — blueprint de automatización (Make/Integromat)
- `clubos_blueprint.json` / `json EDITADO.json` — mismo blueprint, versión editada
- `clubos_schema.sql` — esquema de base de datos
- `clubos_seed.json` — datos de ejemplo/semilla

## Estado
No tiene documentación propia (README, brief) — solo los artefactos técnicos. Antes de
mostrarlo como servicio en la web conviene:
1. Escribir una ficha de qué resuelve (¿venta de entradas? ¿gestión de mesas/VIP? ¿stock de barra?)
2. Separarlo de `NAWEMEDIA_REPO_1` a su propio repo si se va a mantener como producto activo,
   ya que hoy convive con el boilerplate de onboarding sin relación aparente.

## Para la web
Mencionarlo como línea de servicio "a medida" (automatización con Make + Supabase para
clubes/eventos) hasta tener más contexto de si está en producción con algún cliente.
