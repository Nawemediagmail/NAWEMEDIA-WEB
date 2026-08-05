# lower-thirds

Sexta pieza de las 7 mapeadas en [`../frame.md`](../frame.md). Proyecto HyperFrames completo,
listo para re-renderizar.

- **`renders/video.mp4`** — el entregable: 1920×1080, 8s, 1.2 MB. Una barra lower-third
  (izquierda, `bgGlass` + hairline, componente `lower-third` de `frame.md`) entra una sola vez
  y adentro ciclan los **6 DJs reales con EPK activo** listados en
  `00-INVENTARIO-GENERAL.md`: Ambar Lombardi, YEMIX, DJ BINI, DJ Fay, DJ Mario Beckam, DJ
  Elektra — cada uno con su propio color de acento (los 6 hues nombrados de la paleta, sin
  repetir).

## Por qué no hay testimonios/citas

El componente `lower-third` de `frame.md` dice "client credit / testimonial attribution", pero
no hay citas o testimonios reales verificados de estos DJs disponibles en el inventario —
inventar una cita atribuida a una persona real cruza una línea distinta (y más seria) que
inventar una estadística. Se usó en cambio un tag puramente factual y verificable: **"EPK ·
NAWEMEDIA"** (tienen un EPK activo, confirmado en el inventario) — nombre + rol de cliente, sin
palabras puestas en boca de nadie.

## Verificación

`hyperframes check`: 0 errores, contraste WCAG AA 13/13.

## Re-renderizar

```bash
npx hyperframes render . -q high -o ./renders/video.mp4
```
