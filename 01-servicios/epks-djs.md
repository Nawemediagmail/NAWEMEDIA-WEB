# Servicio: Electronic Press Kits (EPKs) para DJs/artistas

## Qué es
Sitios web tipo press kit para DJs: bio, música, shows, galería, redes — con un panel
de administración oculto para que el propio artista o NAWEMEDIA edite el contenido sin
tocar código.

## Repo
`nawemedia-epks` (monorepo, público). Stack: HTML/CSS/JS estático servido desde Vercel,
persistencia de datos vía Supabase (Edge Functions `epk-save` / `epk-load`).

## Cómo funciona (para explicarlo como servicio en la web)
1. Frontend estático por DJ en `djs/[slug]/`
2. Admin panel oculto: `Ctrl+Alt+A`, password `demo2026` (⚠️ rotar antes de mostrar esto públicamente)
3. Los cambios del admin se guardan en Supabase y se sincronizan entre dispositivos
4. Alta de un DJ nuevo en ~10 minutos con `scripts/new-dj.sh`

## Clientes activos (para portfolio/demos)
| Artista | Slug | Estado |
|---|---|---|
| Ambar Lombardi | `ambar-lombardi` | en setup |
| YEMIX | `yemix` | en setup |
| DJ BINI | `dj-bini` | dominio propio: djbini.com |
| DJ Fay | `dj-fay` | activo |
| DJ Mario Beckam | `mario-beckam` | activo |
| DJ Elektra | `dj-elektra` | activo |

Repos individuales de clientes fuera del scope de este inventario (agregar a la sesión si
se necesita detalle): `dj-epk-template` (plantilla base), `dj-nawel-demo-epk`,
`dj-ambarlombardi-epk`, `sofi-epk-app`, `PRESS-KIT-WEB-RONALD-ROSSENOUFF`.

## Para la sección "Demos" del sitio
- Estos EPKs son el portfolio más fuerte y ya está vivo: enlazar directamente o mostrar
  capturas + link "ver EPK en vivo" por cada artista.
- Plan interno pendiente en el repo: escalar a 30 DJs (documentado en el README como
  roadmap "Plan 30 DJs").
