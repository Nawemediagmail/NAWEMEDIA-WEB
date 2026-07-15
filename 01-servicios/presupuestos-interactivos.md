# Servicio: Sistema de Presupuestos Interactivo

## Qué es
Un cotizador interactivo para servicios de la agencia — el visitante arma su presupuesto
en pantalla (probablemente por línea de servicio, cantidad, extras) y ve el total en vivo.
Es el diferencial técnico más fuerte para mostrar en la web: en vez de un formulario
estático de contacto, es una herramienta funcionando.

## Versión recomendada para la web
**`nawemedia-presupuesto-v6`** (repo público, rama `nawemedia`). Es la más madura:
- `nw-tokens.js` — sistema de design tokens (colores, tipografía, espaciados)
- `nw-components.jsx` — componentes reutilizables
- `nw-screens-1.jsx` / `nw-screens-2.jsx` — pantallas/pasos del flujo
- `tweaks-panel.jsx` — panel de ajustes en vivo (probablemente para calibrar precios/opciones)
- `index.html` — build/export monolítico (11MB, probablemente incluye assets embebidos)

## Linaje de versiones (de más vieja a más nueva)
1. `PRESUPUESTO-OS_V4` — versión inicial pública
2. `nawemedia_presupuesto-os_v4.1` — iteración menor
3. `presupuesto-os-nawemedia` — versión intermedia (privada)
4. `nawemedia-presupuesto-v6` — versión actual, con design system propio ⭐

## Para la sección "Presupuestos" del sitio
- Embeber el motor de v6 directamente (iframe o migrando los componentes JSX al proyecto del sitio).
- Si se migra: extraer `nw-tokens.js` + `nw-components.jsx` + las pantallas, en vez de reusar el `index.html` monolítico de 11MB.
- Decidir si el resultado del presupuesto termina en un lead (WhatsApp/email) o en un PDF descargable.
