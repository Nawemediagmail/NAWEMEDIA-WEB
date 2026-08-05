---
version: alpha
name: NAWEMEDIA — Frame (video / frame layer)
description: >
  Video-first design system for HyperFrames pieces on the nawemeddia.com index (hero, scroll
  reveals, stat/chart, transitions, demo previews, lower-thirds, CTA). Colors, gradients and
  radii are copied verbatim from `nw-tokens.js` (nawemedia-presupuesto-v6, the production
  budget engine that will be embedded on the site) — this is not a new palette, it's the
  existing brand rewritten for the frame. Typography is new: the web build has no display
  webfont yet (system font stack only), so this spec introduces the video-first type pair.
unit: the frame — 1920×1080 primary; 1080×1920 and 1080×1080 documented for social cuts
principle: atoms are sacred (brand tokens verbatim) · composition is free · numbers come from the script

colors:
  bg: "#05070D"
  bgSurf: "#0B0E18"
  bgCard: "#101322"
  bgCardHov: "#141827"
  borderLo: "rgba(255,255,255,0.06)"
  borderMd: "rgba(255,255,255,0.10)"
  borderHi: "rgba(255,255,255,0.18)"
  text: "#F1F5F9"
  textMd: "#CBD5E1"
  textMut: "#8B95AA"
  magenta: "#FF2D95"
  coral: "#FF5C39"
  violet: "#7B61FF"
  cyan: "#00E5FF"
  orange: "#FF7A00"
  yellow: "#FFC300"
  green: "#22C55E"
  red: "#EF4444"

gradients:
  main: "linear-gradient(90deg, {colors.magenta} 0%, {colors.coral} 45%, {colors.yellow} 100%)"
  sec: "linear-gradient(90deg, {colors.magenta} 0%, {colors.violet} 50%, {colors.cyan} 100%)"
  btn: "linear-gradient(90deg, {colors.magenta} 0%, {colors.coral} 50%, {colors.yellow} 100%)"

typography:
  # — reading + chrome ramp (JetBrains Mono: ticket-stub / rider / terminal voice) —
  body:      { fontFamily: "JetBrains Mono", cqw: 1.1,  weight: 400, lineHeight: 1.6 }
  eyebrow:   { fontFamily: "JetBrains Mono", px: 20, weight: 700, tracking: "0.14em", upper: true }
  label:     { fontFamily: "JetBrains Mono", px: 18, weight: 700, tracking: "0.10em", upper: true }
  data:      { fontFamily: "JetBrains Mono", cqw: 1.2,  weight: 700, tracking: "0.01em", numeric: "tabular-nums" }
  # — display ramp (League Gothic: condensed, rave-poster, 400 ONLY — no bold/black cut exists) —
  heading-md:{ fontFamily: "League Gothic", cqw: 4.2, weight: 400, lineHeight: 0.95, tracking: "0.01em", upper: true }
  heading-lg:{ fontFamily: "League Gothic", cqw: 6.5, weight: 400, lineHeight: 0.92, tracking: "0.01em", upper: true }
  heading-xl:{ fontFamily: "League Gothic", cqw: 9.5, weight: 400, lineHeight: 0.90, tracking: "0.01em", upper: true }
  stat-number:{ fontFamily: "JetBrains Mono", cqw: 5.5, weight: 700, numeric: "tabular-nums" }

spacing:
  frame-pad: "3.1cqw"     # ~60px @1920
  gap-md: "1.7cqw"
  gap-sm: "0.8cqw"

radius:
  sm: "0.52cqw"   # 10px @1920 — verbatim from nw-tokens.radiusSm
  md: "0.83cqw"   # 16px @1920 — verbatim from nw-tokens.radius
  lg: "1.04cqw"   # 20px @1920 — verbatim from nw-tokens.radiusLg

components:
  logo-mark:
    shape: "triangle, apex-right, ~30% w / 27% h of its box (verbatim proportions from the production loading-splash SVG polygon)"
    fill: "{gradients.main}"
    underline: "thin {gradients.main} rule beneath, {radius.sm} corner"
    description: "The confirmed real isotype (not invented) — reuse this exact triangle geometry, not a generic play/arrow shape."
  hero-kinetic-title:
    fontFamily: "{typography.heading-xl}"
    textColor: "{colors.text}"
    accentWord: "background: {gradients.main}; -webkit-background-clip: text; color: transparent"
    description: "Hero headline. ONE word/phrase per composition gets the gradient-text treatment — verified real usage in production (index.html), not a default. The rest of the line stays solid {colors.text}."
  radial-glow:
    background: "radial-gradient(circle, {colors.magenta}22 0%, transparent 70%)"
    description: "Primary background depth unit. Tint from gradient stops (magenta/violet/cyan or magenta/coral/yellow), 15-25% opacity, slow breathing scale. Replaces full-bleed linear gradients — see Composition Rules."
  ghost-type:
    opacity: "6-10%"
    fontFamily: "{typography.heading-xl}"
    description: "Oversized theme word (BEATS, DROP, SET, LIVE) behind foreground content, {colors.textMut} or {colors.violet} tint, slow drift."
  service-card:
    backgroundColor: "{colors.bgCard}"
    border: "0.15cqw solid {colors.borderMd}"
    rounded: "{radius.md}"
    hoverBackground: "{colors.bgCardHov}"
    accentBar: "0.2cqw tall, one gradient stop color per card, top edge only"
    description: "Scroll-reveal service tile (EPKs / Presupuestos / Catálogo / ClubOS / Redes). Each card gets ONE accent hue from the palette, not the full gradient — five cards cycling five hues is the rhythm."
  stat-tile:
    backgroundColor: "{colors.bgSurf}"
    border: "0.1cqw solid {colors.borderLo}"
    rounded: "{radius.sm}"
    typography: "{typography.stat-number} + {typography.label}"
    description: "Metric with a proportional fill bar or ring behind the number (see data-in-motion rules) — never a bare number floating in space. No pie charts, no gridlines."
  transition-flash:
    base: "flash-through-white catalog block, retinted"
    tint: "{colors.magenta} at flash peak instead of pure white"
    description: "Scene-to-scene cut (Hero→Servicios, Servicios→Demos). Retint the catalog shader so the flash reads as brand, not stock."
  demo-frame:
    backgroundColor: "{colors.bgSurf}"
    border: "0.15cqw solid {colors.borderHi}"
    rounded: "{radius.lg}"
    chrome: "thin top bar, 3 dots {colors.textMut}, no browser text"
    description: "Bezel for embedded product-preview clips (EPK, Presupuestos, Catálogo). Minimal chrome — the product UI is the content, the frame just signals 'this is software.'"
  lower-third:
    backgroundColor: "{colors.bgGlass}"
    border: "0.1cqw solid {colors.borderMd}"
    rounded: "{radius.sm}"
    accentBar: "0.15cqw left edge, one gradient stop color"
    typography: "{typography.eyebrow} (name) + {typography.body} (role/quote)"
    description: "Client credit / testimonial attribution. Left-anchored, never centered."
  cta-button:
    background: "{gradients.btn}"
    textColor: "{colors.bg}"
    rounded: "9999px"
    typography: "{typography.label}"
    description: "The one place a full gradient FILL (not text-clip) is correct — small surface area, no banding risk. Pulse/scale micro-motion, not color-cycling."
  hairline-rule:
    border: "0.05cqw solid {colors.borderMd}"
    description: "Structural divider between zones. Animate scaleX 0→1, never fade."
---

# NAWEMEDIA — Frame (video / frame layer)

## Overview

NAWEMEDIA sells "piezas de calidad cinematográfica con animaciones de alto impacto y un look
único" (verbatim from the production contract terms) to DJs, clubs and event promoters. The
frame layer has to look like the thing it's selling — nightlife, not corporate SaaS.

The palette is **not invented for this spec** — it's copied verbatim from `nw-tokens.js`, the
design tokens already running in production inside `nawemedia-presupuesto-v6` (the budget
engine slated to embed on the site). Deep near-black grounds (`#05070D`/`#0B0E18`), three
accent gradients built from six saturated hues (magenta/coral/yellow, magenta/violet/cyan),
and glass-dark cards with barely-there white borders.

**This intentionally sits close to `house-style.md`'s "lazy default" list** (neon accents,
cyan-on-dark, purple-to-blue). It is not a default here — it's the client's real, shipping
brand, verified against `nw-tokens.js` and the live gradient-text usage in `index.html`. Keep
it because it's true, not because it's easy. The discipline is in *how* it's applied at frame
scale (see Composition Rules), not in avoiding it.

**Key characteristics at frame scale:**

- **Near-black grounds**, never pure `#000` — `#05070D` is the sanctioned "black."
- **Two accent gradients** (warm: magenta→coral→yellow · cool: magenta→violet→cyan) — used as
  *text-clip on one hero word*, *button fill*, or *thin accent bars* — never as a full-bleed
  background (banding risk, see Composition Rules).
- **League Gothic** condensed display (400 only, huge scale) for headlines; **JetBrains Mono**
  for everything else — body, labels, data, eyebrows. Sans + mono, never two sans.
- **Glass-dark cards**: `bgCard`/`bgCardHov` fills, hairline borders (`borderLo/Md/Hi`), radius
  10/16/20px verbatim from the token set.
- **One accent hue per element**, not the full gradient repeated everywhere — five service
  cards cycling five hues is the rhythm; a page of six-color gradients everywhere is noise.

## The Frame

### Frame Craft Bar

- **Squint** — one League Gothic moment dominates per scene at 3–6× its neighbor; mono chrome recedes.
- **Silence** — hero and lower-thirds keep air; service-card grids and stat rows are the dense exception.
- **Restraint** — max ONE full gradient application per scene (text-clip word OR button fill OR
  one accent bar set) — not all three at once.
- **Reference** — aim at a **rave flyer crossed with a synth-module faceplate**: condensed
  poster type, monospace ticket/credit text, glowing accent against near-black. Failure looks
  like a generic "dark mode SaaS landing page" with a rainbow gradient slapped on every button.

- **Primary:** 1920×1080 (16:9), authored in `cqw` (`px ÷ 1920 × 100 = cqw`).
- **Vertical:** 1080×1920 (9:16) for Reels/Stories cuts of the same pieces. **Square:** 1080×1080 (1:1).
- **Safe area:** `frame-pad` ~3.1cqw; glows/ghost-type may bleed off edges.

**The container law (load-bearing).** Every frame ground sets `container-type: size`; all
frame-relative units are `cqw`/`cqh` against it — never `vw`.

## Colors

`{colors.bg}` is the only ground — no scene-to-scene ground cycling (unlike a multi-color
brand system, NAWEMEDIA is one dark ground + accent hues doing the work). `{colors.bgSurf}` /
`{colors.bgCard}` stack as elevation, lightest = closest to camera. Accent hues
(magenta/coral/yellow/violet/cyan) are **interchangeable, no fixed semantic meaning**, except:
`{colors.green}` = success/positive states only, `{colors.red}` = error/urgent only — never
decorative.

**No full-screen linear gradients on the dark ground** — they band under H.264 at this bg
luminance. Where the web token is a literal gradient background, translate it to a **radial
glow** tinted from the same stops (see `radial-glow` component) or restrict the linear
gradient to a small surface (button, text-clip, accent bar).

## Typography

Two voices. **League Gothic** (condensed, uppercase, 400 — no heavier cut exists, so weight
contrast comes from *scale*, not font-weight: `heading-xl` at 9.5cqw against `body` at
1.1cqw is the dramatic jump) carries every headline and hero word. **JetBrains Mono** carries
body copy, labels, data, and eyebrows — it reads as ticket/rider/terminal, which fits a
production-services brand better than a humanist sans would.

- **Legibility floor:** any load-bearing line ≥ 1.4cqw; px labels are chrome only.
- **Fit-to-measure:** ≤3 words → `heading-xl`; 4–6 → `heading-lg`; 7+ → `heading-md`.
- Numeric data (`stat-number`, prices, counts) uses `font-variant-numeric: tabular-nums` —
  always, this is a pricing/budget brand and misaligned digits read as sloppy.
- No sentence-case League Gothic, no untracked display. Mono chrome is always uppercase +
  tracked (`0.10–0.14em`).

## Depth & Surface

- Elevation via fill, not shadow: `bg` → `bgSurf` → `bgCard` → `bgCardHov`, each a touch
  lighter. Avoid heavy drop-shadows; they read as "web card," not "produced video."
- Borders are hairline (`borderLo/Md/Hi` = 6/10/18% white) but **scaled up for video** —
  0.1–0.15cqw (≈2–3px @1920), not the 1px the web token implies. 1px is invisible on video.
- Radius verbatim from the token set: 10/16/20px (`radius.sm/md/lg`) expressed in cqw.

## Components

- **hero-kinetic-title / ghost-type** — the hero voice + its background echo.
- **radial-glow** — primary depth unit, replaces banned full-bleed gradients.
- **service-card / stat-tile** — the two content-density units (catalog grid, metrics).
- **transition-flash** — retinted catalog shader for scene cuts.
- **demo-frame** — bezel for embedded product-preview clips.
- **lower-third** — client/testimonial attribution, left-anchored.
- **cta-button** — the one sanctioned full-gradient-fill surface.
- **hairline-rule** — structural divider, animates via `scaleX`.

## Composition Rules

### Do

- Keep `{colors.bg}` as the only ground across every scene — depth comes from elevation and
  glow, not from cycling background hues.
- Use each accent gradient (`main`/`sec`/`btn`) as **ONE application per scene** — text-clip,
  button fill, or accent bar, never stacked.
- Scale borders to 2–4px equivalent (`0.1–0.15cqw`), radius verbatim (10/16/20px in cqw).
- Pair League Gothic (display, huge scale) with JetBrains Mono (everything else) — the
  scale jump IS the weight contrast.
- Give every scene at least one radial glow or ghost-type layer — a flat `{colors.bg}` field
  with nothing behind the content reads as empty, not minimal.
- `tabular-nums` on every price/stat/count.

### Don't

- No full-bleed linear-gradient backgrounds (banding on H.264) — radial glow instead.
- No pure `#000`/`#fff` — `{colors.bg}` and `{colors.text}` are the sanctioned near-black/near-white.
- No second sans-serif anywhere (no Inter/Roboto/Poppins alongside League Gothic) — mono is
  the only partner.
- No heavy drop-shadows on cards — elevation is fill-based here, not shadow-based.
- No decorative use of `{colors.green}`/`{colors.red}` — reserved for real success/error states.
- Don't gradient-text more than one word/line per scene — it stops reading as emphasis and
  starts reading as decoration.

## Aspect-Ratio Behavior

| Piece            | 16:9 (site embed)                    | 9:16 (Reels/Stories)              | 1:1 (feed)              |
| ----------------- | ------------------------------------ | ---------------------------------- | ------------------------ |
| Hero kinetic type | title left-anchored, glow right      | title top, glow below              | title centered, tighter glow |
| Service reveal    | 5 cards cascading left→right         | 5 cards stacked, faster stagger    | 2×2 + 1                  |
| Stat/chart        | 2-3 tiles side-by-side               | tiles stacked                      | 2×2                      |
| Transition flash  | full-frame                           | full-frame                         | full-frame               |
| Demo preview      | 16:9 bezel, native                   | bezel letterboxed top/bottom       | bezel cropped to square  |
| Lower-third       | bottom-left, ~40% width              | bottom, ~80% width                 | bottom, ~70% width       |
| CTA button        | bottom-right or centered close       | centered, larger tap target        | centered                 |

## Approved Entities

No client names, logos, or numbers are fabricated here. Client references (Ambar Lombardi,
YEMIX, DJ BINI, DJ Fay, DJ Mario Beckam, DJ Elektra) come from `00-INVENTARIO-GENERAL.md` —
confirm current/permitted-to-feature status before using any name in a rendered piece.

## Numerals & Claims (hard rule)

Never invent prices, counts, or stats at frame scale. Prices come from `nw-tokens.js`
(`window.NW.CATALOG`) or the live budget engine — render placeholders (`{price}`, `— figure —`)
until a script/data source supplies real values.

## Pre-Render Self-Audit

- **Squint** — one League Gothic moment dominates per scene; mono recedes to chrome.
- **Gradient discipline** — at most one full gradient application per scene; no full-bleed linear gradient on the dark ground.
- **Type** — League Gothic uppercase 400-only at huge scale vs. JetBrains Mono elsewhere; tabular-nums on all numbers.
- **Depth** — at least one glow/ghost-type layer per scene; elevation via fill, not heavy shadow.
- **Color** — `{colors.green}`/`{colors.red}` only on real success/error states.
- **Fabrication** — every price/stat/client name traces to `nw-tokens.js` or the inventory, else placeholder.

## Known Gaps

- **Typography is a deliberate divergence, not an oversight.** Correction: the web build
  (`nawemedia-presupuesto-v6`) DOES ship a custom webfont — **Sora**, weights 400–800, on
  `body` (verified in the app's embedded CSS, not just the loading splash). Sora is on
  `typography.md`'s banned-monoculture list — it's the safe, generic choice every AI-assisted
  build reaches for, which is exactly why the video layer doesn't inherit it: at frame scale
  the type IS the poster, and a rave-poster condensed display (League Gothic) reads far more
  distinctive than Sora does at 200px+. If this pairing under-performs in practice, the fallback
  is Sora at video scale, not a silent revert.
- **Logo mark exists — use it, don't invent a substitute.** The production loading splash
  (`index.html`) inlines the real isotype: a **play-button triangle** in `{gradients.main}`
  (`polygon points="155,110 245,150 155,190"` in a 400×300 viewBox, i.e. a triangle roughly
  30% width / 27% height, apex-right) above a thin gradient underline rule, above the
  wordmark. Reuse this exact triangle geometry (scaled) as a decorative/closing mark instead
  of a generic shape — it's the one piece of real brand identity confirmed outside the token
  file. New component: `logo-mark` — `{gradients.main}`-filled triangle, same proportions,
  paired with a `{radius.sm}` gradient underline rule.
- **Motion intentionally out of scope.** This spec is composition + brand only — durations,
  eases, and per-piece choreography for the 7 animations discussed (hero, scroll reveal,
  stat/chart, transition, demo preview, lower-third, CTA) live in `hyperframes-animation`
  when each piece gets built.
- **`{colors.bgGlass}` (used by `lower-third`)** is `rgba(16,19,34,0.85)` from `nw-tokens.js` —
  kept as-is; verify it still reads over busy demo-preview footage, may need to raise opacity.
