# Servicio: Catálogo Automático

## Qué es
Sistema para generar catálogos (de productos/servicios) de forma automática, con
exportación de imagen (usa `html2canvas`, probablemente para generar catálogos como
imagen/PDF compartible).

## Repo
`nawemedia-catalopg-os-v5` (público, rama por defecto `nawemedia`). Stack: Vite + React + TypeScript.

## Notas de origen
El `package.json` interno todavía dice `"name": "presupuesto-os"` — este proyecto se
bootstrapeó a partir del código del sistema de presupuestos y nunca se renombró. Tenerlo
en cuenta si se reusa código común entre ambos sistemas (podrían compartir componentes base).

## Material de diseño disponible
- `designMOCKUP_V7.png` — mockup visual, marcado como **fuente visual principal**
  (`IMPLEMENTATION_NOTES.md`: "en caso de conflicto visual, seguir MOCKUP_V7")
- `NAWEMEDIA_UI_REDESIGN_BRIEF.md` — brief de rediseño de UI
- `NAWEMEDIA_MOCKUP_V7_CODEX_PROMPT.md` — prompt usado para generar/iterar el mockup

## Para la web
- El mockup V7 y el brief de rediseño son material reusable directamente para el
  lenguaje visual del sitio institucional (ya hay un sistema de diseño en construcción).
