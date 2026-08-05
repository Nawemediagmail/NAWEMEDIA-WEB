# HyperFrames — motor de video HTML-nativo para agentes

Repo: [`heygen-com/hyperframes`](https://github.com/heygen-com/hyperframes) (Apache 2.0, público, no es de NAWEMEDIA).

Framework open source que convierte HTML/CSS + animaciones seekable (GSAP, CSS,
Lottie, Three.js, Anime.js, WAAPI) en video MP4 determinístico, renderizado con
Chrome headless + FFmpeg. Sin build step: un `index.html` con atributos
`data-*` de timing es la composición completa.

## Estado en esta sesión
Instalados los **8 skills del core set** a nivel de usuario (`~/.claude/skills/`,
`~/.agents/skills/`) vía:

```bash
npx hyperframes skills update
```

Esto **no modifica este repo** — es una instalación de agente, no una dependencia
de proyecto. Para usarla en otro entorno hay que correr el mismo comando ahí
(o `npx skills add heygen-com/hyperframes --full-depth` en modo interactivo).

| Skill | Función |
|---|---|
| `hyperframes` | Router — entrada para cualquier pedido de video/animación |
| `hyperframes-core` | Contrato de composición HTML (timing, tracks, clips) |
| `hyperframes-animation` | Reglas de motion, adaptadores GSAP/Lottie/Three.js/etc. |
| `hyperframes-keyframes` | Keyframes seek-safe |
| `hyperframes-creative` | Dirección creativa (paletas, tipografía, narración) |
| `hyperframes-cli` | Loop de dev: init, preview, render |
| `hyperframes-registry` | Instalar bloques/componentes reusables del catálogo |
| `media-use` | OS de medios: BGM, SFX, imágenes, voz, etc. |

> **Ojo:** el propio instalador marca `media-use` como **High Risk / Critical Risk
> (Snyk, 3 alertas)** — corre con permisos completos de agente. Revisar antes de
> usarlo en un flujo de cliente real.

## Para qué serviría en nawemeddia.com / NAWEMEDIA
- Generar videos de producto/demo para la sección "Demos" (promo de EPKs,
  walkthroughs de Presupuestos/Catálogo/ClubOS) a partir de HTML sin depender
  de un editor de video manual.
- Reels/kinetic captions para redes a partir de los mismos assets de marca
  (`nw-tokens.js` de `nawemedia-presupuesto-v6` podría alimentar un `frame.md`).
- Requiere Node.js 22+ y FFmpeg en el entorno de render.

## Requisitos
- Node.js ≥ 22, FFmpeg.
- No agrega dependencias a `package.json` de ningún proyecto NAWEMEDIA: vive
  como skill de agente, se invoca bajo demanda.
