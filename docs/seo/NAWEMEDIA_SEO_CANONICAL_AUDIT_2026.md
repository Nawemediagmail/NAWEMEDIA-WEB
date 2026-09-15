# Auditoría técnica SEO — Canonical / "Duplicada: el usuario no ha indicado ninguna versión canónica"

**Sitio:** https://www.nawemedia.com/
**Repositorio auditado:** `NAWEMEDIA-WEB` (rama `claude/nawemedia-seo-canonical-audit-279ux8`, commit `465a8ac`)
**Avisos de Google Search Console:** 23-ago-2026 y 06-sep-2026
**Fecha de la auditoría:** 15-sep-2026
**Alcance:** solo lectura. No se modificó código, no se hicieron commits, no se tocó Vercel.

> Convención de este informe: **HECHO** = verificado directamente en código o vía HTTP. **HIPÓTESIS** = inferencia razonable a partir de evidencia, no confirmable sin acceso a GSC. **NO CONFIRMADO** = no pudo verificarse con las herramientas disponibles en esta sesión.

---

## 1. Resumen ejecutivo

`nawemedia-web` **no es un proyecto Next.js**. Es un sitio estático (HTML/CSS/JS vanilla) servido por Vercel desde la carpeta `sitio/`, con un único `vercel.json` de redirects/rewrites. No hay App Router, Pages Router, `generateMetadata` ni `metadataBase` — cada página es un archivo `.html` independiente y el `<link rel="canonical">` tiene que escribirse a mano en cada uno.

De las **13 páginas públicas** detectadas, **solo la home (`/`) tiene `<link rel="canonical">`**. Ninguna otra página del sitio lo tiene. Además, Vercel no fuerza `www` ni trailing slash: `nawemedia.com` (sin www) y `/ruta` sin barra final devuelven **HTTP 200 con contenido idéntico**, sin redirect, para prácticamente todas las rutas — multiplicando por 2-4 el número de URLs accesibles por cada página real.

De las dos únicas URLs no-home que están en el `sitemap.xml` (`/presupuesto/` y `/demos/savori-pedidos-hub.html`), **ambas carecen de canonical, meta description y `lang`**, y ambas son artefactos "bundle" generados por una herramienta externa (probablemente `nawemedia-presupuesto-v6`) que comparten literalmente el mismo HTML/JS de arranque (misma pantalla de carga, misma lógica de desempaquetado), diferenciándose solo en textos y colores. Esto las convierte en el candidato más fuerte y mejor evidenciado como causa del aviso de GSC.

## 2. Causa probable del aviso de Google Search Console

**HIPÓTESIS (alta confianza, no confirmable sin acceso a GSC):**

1. **Causa principal:** `/presupuesto/` y `/demos/savori-pedidos-hub.html` — las dos únicas URLs de contenido "real" del sitemap además de la home — son exportaciones de un bundler que comparten una plantilla HTML/JS casi idéntica (mismo wrapper `__bundler_thumbnail`/`__bundler_loading`, misma lógica de decodificación de blobs, mismos nombres de función) y **ninguna declara canonical**. Para el rastreador de Google esto es el patrón textual de "Duplicada, el usuario no señaló canonical": dos URLs con HTML de arranque casi idéntico, sin señal de cuál es la autoritativa.
2. **Refuerzo:** `/presupuesto/` **está embebida como `<iframe>` dentro de la propia home** (`sitio/index.html:518`, `src="presupuesto/index.html"`). Google puede considerar que el contenido de `/presupuesto/` ya está contenido en `/`, y sin canonical no hay forma de indicarle si debe tratarla como independiente o subordinada a la home.
3. **Refuerzo estructural (afecta a todo el sitio, no solo a esas dos URLs):** ausencia total de redirect `www ⇄ non-www` y de normalización de trailing slash. Cualquier página sin canonical propio (11 de 13) es alcanzable por al menos 4 variantes de URL con contenido idéntico y 0 señal de cuál preferir.
4. **Refuerzo cross-dominio:** dos rutas del sitio (`/virginiasoledispa/` y `/press-kit-web_formulario-DJ`) son `rewrites` de Vercel hacia otros dominios (`nawemedia-epks.vercel.app`, `nawemedia-onboarding.vercel.app`). El mismo contenido es accesible en 2 dominios distintos y **ninguno de los 4** (2 rutas × 2 dominios) declara canonical.

**Línea de tiempo que sostiene la hipótesis (HECHO, extraído de `git log`):**

| Fecha | Evento |
|---|---|
| 2026-07-16 | `sitemap.xml` se crea incluyendo `/` y `/demos/savori-pedidos-hub.html` (commit `5018db0`) |
| 2026-08-16 | Se agrega `/presupuesto/` al sitemap (commit `c486225`). El propio mensaje de commit ya documenta el problema: *"sitio/presupuesto/index.html es un bundle autogenerado [...] el HTML que Google rastrea como esa página no tiene lang, meta description ni OG propios [...] el fix real va en el proyecto fuente"* |
| **2026-08-23** | **1er aviso GSC — "Duplicada, sin canonical"** (7 días después de sumar `/presupuesto/` al sitemap) |
| **2026-09-06** | **2do aviso GSC** — consistente con el ciclo de actualización del reporte de Cobertura de GSC (no diario), probablemente confirmando o ampliando el mismo clúster de duplicados |
| 2026-09-07/08 | Se agregan `/case-study/miculka/` y una skill de auditoría de landing (sin relación con las fechas de los avisos) |

No hay acceso a Google Search Console en esta sesión, por lo que **no puedo confirmar qué URLs exactas figuran en el reporte de GSC** — esta causa está armada por evidencia circunstancial fuerte (commit que ya predecía el problema + timing de 7 días + duplicación estructural verificada por HTTP), no por lectura directa del reporte. Ver sección 18 para la lista de URLs a verificar manualmente.

## 3. Inventario completo de rutas

Framework: **ninguno** (HTML/CSS/JS estático). Hosting: **Vercel**, root de deploy = `sitio/` (contiene el único `vercel.json` del repo). Routing: basado en archivos — cada carpeta con `index.html` es una ruta "limpia", cada `.html` suelto es una ruta con extensión.

| Ruta repo | URL pública | Tipo | Estática/Dinámica | Metadata propia | Canonical explícita | Canonical detectada | ¿Puede duplicarse? | Riesgo | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| `sitio/index.html` | `/` | Home | Estática | Sí (completa) | Sí | `https://www.nawemedia.com/` | Con non-www (mitigado por canonical hardcodeado) | Bajo | `index.html:4-23,43-90` |
| `sitio/presupuesto/index.html` | `/presupuesto/` y `/presupuesto` | Herramienta de cotización (embebida como iframe en `/`) | Dinámica (CSR, bundle React desempaquetado en runtime) | No (solo `<title>`) | **No** | — | **Sí** — con `/demos/savori-pedidos-hub.html` (shell idéntico), con `/` (está embebida ahí), con `nawemedia.com/presupuesto/` (non-www), con `/presupuesto` sin slash | **Alto** | `presupuesto/index.html:1-20`; embed en `index.html:518-524` |
| `sitio/demos/savori-pedidos-hub.html` | `/demos/savori-pedidos-hub.html` | Demo comercial (Savori) | Dinámica (CSR, mismo bundler) | No (solo `<title>`) | **No** | — | **Sí** — con `/presupuesto/` (shell idéntico) | **Alto** | `demos/savori-pedidos-hub.html:1-30` |
| `sitio/electric-side/index.html` | `/electric-side` y `/electric-side/` | App de gestión interna de un cliente (Electric Side) | Estática (app JS embebida, sin backend visible) | Parcial (solo `<title>`, sin description/OG/robots) | **No** | — | **Sí** — entre `/electric-side` y `/electric-side/` (confirmado por curl: contenido byte-a-byte idéntico, 0 redirect) | **Alto** | `electric-side/index.html:1-8`; verificación HTTP: ambas 200, `diff` sin diferencias |
| `sitio/p/electric-side/index.html` | `/p/electric-side/` y `/p/electric-side` | Presupuesto privado (Electric Side V1 Reducida) | Estática | Parcial | No (correcto, tiene `noindex`) | — | Baja prioridad (ya protegida por `noindex`) | Bajo | `p/electric-side/index.html:6-7` |
| `sitio/p/DJ_Yemix_Torera/index.html` | `/p/DJ_Yemix_Torera/` | Presupuesto privado DJ Yemix | Estática | Parcial | No (correcto, tiene `noindex`) | — | Baja prioridad | Bajo | `p/DJ_Yemix_Torera/index.html:6,8` |
| `sitio/lombardi/index.html` | `/lombardi/` | Boleta de pago EPK Ambar Lombardi | Estática | Parcial | No (correcto, tiene `noindex`) | — | Baja prioridad | Bajo | `lombardi/index.html:6,8` |
| `sitio/filmbase-leo/index.html` | `/filmbase-leo/` | Demo comercial FILMBASE LEO | Estática | Sí (title/desc/OG completos) pero con `noindex` | No | — | Baja prioridad | Bajo | `filmbase-leo/index.html:7-12` |
| `sitio/fiestasoops_29ago/index.html` | `/fiestasoops_29ago/` | Propuesta privada Fiestas OOPS | Estática | Mínima | No (correcto, tiene `noindex`) | — | Baja prioridad | Bajo | `fiestasoops_29ago/index.html:5-6` |
| `sitio/press-kit-web/index.html` | `/press-kit-web/` | Checkout/revisión de pago EPK (enlazada desde la home como CTA "Pedí el tuyo →") | Estática | Parcial, con `noindex` | No (intencional) | — | Baja prioridad (es página transaccional, noindex es correcto) | Bajo/Medio | `press-kit-web/index.html:6,8`; link en `index.html:221` |
| `sitio/case-study/miculka/index.html` | `/case-study/miculka/` y `/case-study/miculka` | Case study cliente Miculka Logística | Estática | Mínima (solo `<title>`, sin description/OG/robots) | **No** | — | **Sí** — entre con/sin slash; y es huérfana (no enlazada desde `/`, no está en sitemap) pero sí indexable por defecto | **Medio** | `case-study/miculka/index.html:1-6`; no aparece en `grep href index.html`; no está en `sitemap.xml` |
| `sitio/admin-facturas/index.html` | `/admin-facturas/` | Panel privado de facturación (PWA) | Estática | Parcial, `noindex,nofollow` **+** `Disallow` en robots.txt | No (intencional) | — | Contradicción técnica (ver 3.1) | Medio | `admin-facturas/index.html:6-7`; `robots.txt:2` |
| `sitio/admin-facturas/historial.html` | `/admin-facturas/historial.html` | Historial de facturas (privado) | Estática | Parcial, `noindex,nofollow` **+** `Disallow` | No (intencional) | — | Misma contradicción | Medio | `admin-facturas/historial.html:6-7` |
| — (rewrite Vercel) | `/virginiasoledispa/` → sirve contenido de `nawemedia-epks.vercel.app` | EPK cliente (repo externo `nawemedia-epks`) | Estática, cross-domain | Parcial (title/description) | **No** (en ninguno de los 2 dominios) | — | **Sí** — mismo contenido accesible en `www.nawemedia.com` y en `nawemedia-epks.vercel.app`, sin canonical en ningún lado | **Alto** | `vercel.json` rewrite; verificación HTTP cruzada (ver sección 8) |
| — (rewrite Vercel) | `/press-kit-web_formulario-DJ` → sirve contenido de `nawemedia-onboarding.vercel.app` | Formulario onboarding DJ (repo externo `nawemedia-onboarding`) | Estática/Next.js, cross-domain | Parcial | **No** (en ninguno de los 2 dominios) | — | **Sí** — mismo problema que arriba | **Alto** | `vercel.json` rewrite; verificación HTTP cruzada |
| `sitio/api/*.js` (4 archivos) | `/api/create-invoice`, `/api/generate-payment`, `/api/invoice-log`, `/api/lombardi-payment`, `/api/press-kit-payment` | Funciones serverless (backend de pagos) | N/A — no son páginas HTML | N/A | N/A | N/A | No aplica (bloqueadas en robots.txt) | Bajo | `robots.txt:3` |

**No se detectaron:** `/servicios` ni `/proyectos` como rutas propias — esos son anchors internos de la home (`#servicios`, `href="#clientes"`, etc.), no URLs separadas. No hay `/demos` como índice — solo existe `/demos/savori-pedidos-hub.html`. No hay páginas accesibles con login (no hay sistema de auth: `admin-facturas` usa `ADMIN_PASSWORD` solo como variable de entorno para las funciones `/api/*`, la página HTML en sí no tiene gate de contraseña del lado del cliente — **NO CONFIRMADO** si hay algún chequeo de sesión no detectado por grep estático; recomiendo revisión manual de `electric-side/index.html` y `admin-facturas/index.html` completos si esto es sensible).

### 3.1 Nota fuera de alcance SEO pero relevante como hallazgo colateral

`/electric-side/` es una herramienta interna de gestión (clientes, trabajos, materiales, pagos) de un cliente real, servida como página pública, **sin ningún mecanismo de autenticación visible en el HTML**, sin `noindex`, sin bloqueo en `robots.txt`. Esto es simultáneamente un problema de indexación (contenido no destinado a buscarse apareciendo en Google) y un problema de exposición de datos de negocio de un cliente. Lo señalo porque explica por qué esta página es indexable por defecto — la corrección SEO (agregar `noindex`) es trivial, pero la exposición de datos de cliente sin auth es una decisión que excede esta auditoría y amerita confirmación explícita del usuario antes de tocar nada.

## 4. Tabla de canonicals

| URL afectada | Canonical actual | Canonical recomendada | Motivo | Archivo responsable | Línea aprox. | Prioridad |
|---|---|---|---|---|---|---|
| `/presupuesto/` | Ninguna | `https://www.nawemedia.com/presupuesto/` (o eliminar la URL del índice, ver Fase 4) | Es una de las 2 URLs del sitemap sin canonical; comparte shell con `/demos/...`; está embebida como iframe en `/` | `sitio/presupuesto/index.html` | Insertar tras la línea 2 (`<head>`) | **P0** |
| `/demos/savori-pedidos-hub.html` | Ninguna | `https://www.nawemedia.com/demos/savori-pedidos-hub.html` | Misma causa que arriba; comparte shell con `/presupuesto/` | `sitio/demos/savori-pedidos-hub.html` | Insertar tras la línea 2 (`<head>`) | **P0** |
| `/electric-side/` y `/electric-side` | Ninguna | Evaluar `noindex` en vez de canonical (ver Fase 4 — no es contenido para buscar) | Página interna indexable sin protección, duplicada con/sin slash | `sitio/electric-side/index.html` | Insertar tras la línea 6 | **P0** |
| `/case-study/miculka/` y sin slash | Ninguna | `https://www.nawemedia.com/case-study/miculka/` | Contenido único válido para indexar, pero sin canonical ni protección de duplicado por slash | `sitio/case-study/miculka/index.html` | Insertar tras la línea 5 | **P1** |
| `/virginiasoledispa/` (contenido de `nawemedia-epks.vercel.app`) | Ninguna en ninguno de los 2 dominios | `https://www.nawemedia.com/virginiasoledispa/` en la copia servida por rewrite; evaluar si la copia en `nawemedia-epks.vercel.app` debe ser `noindex` o canonicalizar hacia `www.nawemedia.com` | Mismo contenido en 2 dominios sin señal de cuál es el autoritativo | Repo `nawemedia-epks` (**fuera de este repo** — no confirmado su código, solo su HTML servido) | N/A | **P1** |
| `/press-kit-web_formulario-DJ` (contenido de `nawemedia-onboarding.vercel.app`) | Ninguna en ninguno de los 2 dominios | Igual que el caso anterior | Igual que el caso anterior | Repo `nawemedia-onboarding` (**fuera de este repo**) | N/A | **P1** |
| Todas las páginas con `noindex` (`/p/*`, `/lombardi/`, `/fiestasoops_29ago/`, `/press-kit-web/`, `/filmbase-leo/`, `/admin-facturas/*`) | Ninguna | No aplica — el canonical es redundante en una página `noindex`; no se recomienda agregar | El `noindex` ya resuelve la indexación; agregar canonical no aporta y puede confundir mantenimiento futuro | — | — | P3 (no accionable) |
| `/` en `nawemedia.com` (sin www) | `https://www.nawemedia.com/` (hardcodeada, correcta) | Sin cambios en el HTML — pero considerar 301 a nivel de dominio (Fase 8) | Ya está mitigado por el canonical, pero depender solo de canonical (sin redirect) no es la práctica recomendada por Google para normalización de dominio | Config de dominio en Vercel, no código | N/A | **P2** |
| Todas las páginas sin `noindex` y sin canonical accedidas por `nawemedia.com` (sin www) | Ninguna | Canonical explícita apuntando a `www.` (una vez agregada por el punto anterior de esta tabla, hereda automáticamente) | Mismo contenido en 2 dominios | Todas las de la fila 1-4 | — | Se resuelve solo al agregar canonical explícito por página (no requiere trabajo adicional) |

## 5. Tabla de duplicaciones

| Grupo duplicado | URLs involucradas | Naturaleza de la duplicación | Solución recomendada |
|---|---|---|---|
| A — Shell de bundler | `/presupuesto/`, `/demos/savori-pedidos-hub.html` | HTML/JS de arranque casi idéntico (misma lógica `__bundler_thumbnail`/`__bundler_loading`/decodificación de blobs), generado por la misma herramienta externa. **No es duplicación de contenido de negocio** (el contenido real, una vez desempaquetado por JS, es distinto: cotizador vs. demo de menú) — es duplicación de **la plantilla de carga que Google ve primero**. | Declarar canonical en cada uno (autorreferencial) **y** completar `lang`, `<meta name="description">` y OG en el wrapper estático — no en el generador, para no perderlo en el próximo build, tal como ya advirtió el commit `c486225`. Evaluar además exportar desde el generador (`nawemedia-presupuesto-v6`) HTML con metadata real de origen, para no depender de parches manuales en cada artefacto futuro. |
| B — Trailing slash | Toda ruta tipo carpeta: `/presupuesto` vs `/presupuesto/`, `/electric-side` vs `/electric-side/`, `/case-study/miculka` vs `/case-study/miculka/`, `/press-kit-web` vs `/press-kit-web/`, etc. | Contenido byte-a-byte idéntico entre ambas variantes (confirmado por `diff` en `/electric-side`), sin redirect entre ellas. | Configurar `"trailingSlash": true` (o `false`, a elección, pero consistente) en `sitio/vercel.json`, o agregar `redirects` explícitos 301/308 por ruta. Ver riesgo en sección 13 (puede tocar todo el árbol de rutas). |
| C — www / non-www | `nawemedia.com` vs `www.nawemedia.com` (toda página) | Contenido idéntico en ambos hosts, sin redirect; la home está mitigada por canonical hardcodeado, el resto no. | Configurar el dominio `nawemedia.com` en Vercel para que redirija (301/308) a `www.nawemedia.com`, en vez de servir el mismo deployment en ambos. Es config de dominio en el proyecto Vercel, no cambio de código. |
| D — `/presupuesto/` embebida en `/` | `/` (sección `#presupuesto`, `index.html:518` `<iframe src="presupuesto/index.html">`) vs `/presupuesto/` como URL independiente en el sitemap | El cotizador vive físicamente dentro de la home vía iframe, pero además se publica como URL propia e indexable. Google puede ver el contenido de `/presupuesto/` como subconjunto de `/`. | Declarar `noindex` en `/presupuesto/` si su único propósito es ser el iframe embebido (no está pensada para recibir tráfico de búsqueda directo), **o** si se la quiere indexar como herramienta standalone, sacarla del iframe y darle metadata propia completa. Ambas son válidas — es una decisión de producto, no solo técnica. |
| E — Rewrite cross-domain | `/virginiasoledispa/` (nawemedia.com) ↔ contenido idéntico en `nawemedia-epks.vercel.app` · `/press-kit-web_formulario-DJ` (nawemedia.com) ↔ contenido idéntico en `nawemedia-onboarding.vercel.app` | Mismo HTML servido en 2 dominios distintos sin relación canonical entre ellos. Los dominios `*.vercel.app` no tienen `robots.txt` propio (404) — son rastreables por defecto. | Canonicalizar la copia en `*.vercel.app` hacia `www.nawemedia.com` (si ese repo lo permite), o `noindex` en el dominio `*.vercel.app` para dejar `www.nawemedia.com` como única versión indexable. Requiere tocar los repos `nawemedia-epks` / `nawemedia-onboarding` (fuera de este repo). |
| F — `/electric-side` vs `/p/electric-side` | Nombres de ruta parecidos, **contenido distinto** (confirmado por título y estructura: una es el dashboard completo de gestión, la otra es un presupuesto acotado V1) | **No es duplicación real** — es solo coincidencia de nombre. Se incluye en esta tabla únicamente para dejar constancia de que se revisó y se descartó como falso positivo. | Ninguna acción de canonical; sí aplica la corrección de la fila del Grupo A/B (bloquear indexación de `/electric-side` por ser herramienta interna). |

**Aclaración pedida por el enunciado:** ninguna de las duplicaciones detectadas se basa en "usan el mismo componente" — B, C y E son duplicaciones de **infraestructura** (mismo archivo servido en 2 URLs), verificadas por HTTP real, no por lectura de código. A es duplicación de **plantilla de arranque compartida**, verificada por diff de código fuente. D es una relación de **inclusión** (iframe), no de contenido copiado.

## 6. Auditoría de sitemap

Un solo sitemap, sin índice de sitemaps, servido en `sitio/sitemap.xml` (idéntico en local y en producción, verificado por diff).

| URL del sitemap | Estado HTTP | Canonical | Indexable | Problema detectado | Corrección recomendada |
|---|---|---|---|---|---|
| `https://www.nawemedia.com/` | 200 | Sí, correcta | Sí | Ninguno | — |
| `https://www.nawemedia.com/presupuesto/` | 200 | **Ausente** | Sí (por defecto, sin señal) | Sin canonical, sin meta description, sin `lang`, comparte shell con `/demos/...`, embebida como iframe en `/` | Ver Fase 4/5, grupo A y D. **P0** |
| `https://www.nawemedia.com/demos/savori-pedidos-hub.html` | 200 | **Ausente** | Sí (por defecto, sin señal) | Sin canonical, sin meta description, sin `lang`, comparte shell con `/presupuesto/` | Ver Fase 4/5, grupo A. **P0** |

**Ausencias notables (URLs públicas relevantes que no están en el sitemap):**
- `/case-study/miculka/` — contenido único, comercialmente relevante, sin `noindex` — candidata a sumarse una vez tenga canonical y metadata propia.
- `/press-kit-web/` — correctamente ausente (tiene `noindex`, es página transaccional).
- `/electric-side/`, `/p/*`, `/lombardi/`, `/filmbase-leo/`, `/fiestasoops_29ago/`, `/admin-facturas/*` — correctamente ausentes (privadas o internas).

No se detectaron URLs con parámetros, URLs de preview de Vercel, ni URLs duplicadas dentro del propio sitemap.

## 7. Auditoría de robots.txt

```
User-agent: *
Disallow: /admin-facturas/
Disallow: /api/

Sitemap: https://www.nawemedia.com/sitemap.xml
```

Idéntico entre `sitio/robots.txt` (repo) y `https://www.nawemedia.com/robots.txt` (producción) — verificado por diff, sin diferencias.

- No bloquea ninguna página comercial, case study, servicio o portfolio. **Correcto.**
- Declara el sitemap correctamente.
- **Hallazgo (P2):** `Disallow: /admin-facturas/` bloquea el rastreo de una carpeta que **también** tiene `<meta name="robots" content="noindex,nofollow">` en sus 2 páginas. Esto es contradictorio: al bloquear el rastreo por `robots.txt`, Googlebot **no puede leer el meta `noindex`** de esas páginas. Si alguna vez existe un enlace externo hacia `/admin-facturas/` o `/admin-facturas/historial.html`, Google puede indexar la URL "a ciegas" (sin título ni descripción, solo la URL) precisamente porque nunca llega a ver la instrucción de no indexar. La práctica recomendada por Google es usar **una sola señal**: si querés controlar vía `noindex`, no la bloquees por `robots.txt` (dejá que la rastree, lea el meta, y la excluya); si la bloqueás por `robots.txt`, no hace falta el meta `noindex` (Google directamente no la rastrea, aunque puede indexar la URL pelada si está enlazada).
- No hay diferencia detectada entre robots.txt local y producción.
- **NO CONFIRMADO:** si existe algún `robots.txt` específico para los subdominios `*.vercel.app` de los repos externos (`nawemedia-epks`, `nawemedia-onboarding`) — se verificó por HTTP que ambos devuelven 404 en `/robots.txt`, es decir, **no tienen ninguno propio** y son rastreables sin restricción por defecto.

## 8. Auditoría de metadata y Open Graph

| Página | title | description | canonical | robots | OG | Twitter Card | lang | JSON-LD | Clasificación |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Sí | Sí | Sí | (implícito: index) | Completo | Completo | `es` | Organization + FAQPage | **SEO completa** |
| `/presupuesto/` | Sí (genérico) | No | No | No | No | No | **Falta** | No | **Defectuosa** |
| `/demos/savori-pedidos-hub.html` | Sí | No | No | No | No | No | **Falta** | No | **Defectuosa** |
| `/electric-side/` | Sí | No | No | No | No | No | `es` | No | **Defectuosa** (indexable sin querer) |
| `/p/electric-side/` | Sí | No | No | `noindex,nofollow` | No | No | `es` | No | **No indexable intencionalmente** |
| `/p/DJ_Yemix_Torera/` | Sí | Sí | No | `noindex,nofollow` | No | No | `es` | No | **No indexable intencionalmente** |
| `/lombardi/` | Sí | Sí | No | `noindex,nofollow` | No | No | `es` | No | **No indexable intencionalmente** |
| `/filmbase-leo/` | Sí | Sí | No | `noindex,nofollow` | Completo | No | `en` | No | **No indexable intencionalmente** (con metadata completa "de más", inconsistente pero inofensivo) |
| `/fiestasoops_29ago/` | Sí | No | No | `noindex,nofollow` | No | No | `es` | No | **No indexable intencionalmente** |
| `/press-kit-web/` | Sí | Sí | No | `noindex,nofollow` | No | No | `es` | No | **No indexable intencionalmente** |
| `/case-study/miculka/` | Sí | No | No | No | No | No | `es` | No | **Duplicada / huérfana** — falta metadata y canonical, no está protegida ni promovida |
| `/admin-facturas/` y `/historial.html` | Sí | No | No | `noindex,nofollow` + `Disallow` | No | No | `es` | No | **No indexable intencionalmente** (con la contradicción de la sección 7) |

**Idioma:** el sitio es mayormente `es` (correcto, target Argentina/LatAm, `og:locale es_AR` en la home). `filmbase-leo/index.html` está en `en` — es intencional (demo en inglés para un caso internacional), no es un error, se deja constancia.

**`metadataBase` / base URL global:** no aplica — no hay framework que centralice esto. Cada archivo declara (o no) sus URLs absolutas a mano. La home usa URLs absolutas correctas (`https://www.nawemedia.com/...`) en OG/canonical; el resto de páginas, al no tener OG/canonical, no tiene este riesgo pero tampoco el beneficio.

**Imagen OG (`og-cover.png`):** verificado por HTTP, 200, `image/png`. Correcta.

## 9. Auditoría de Vercel y dominios

- **Root del deploy:** `sitio/` (único `vercel.json` del repo).
- **`vercel.json` (HECHO, contenido completo):**
  ```json
  {
    "redirects": [
      { "source": "/virginiasoledispa", "destination": "/virginiasoledispa/", "permanent": false }
    ],
    "rewrites": [
      { "source": "/press-kit-web_formulario-DJ", "destination": "https://nawemedia-onboarding.vercel.app/press-kit-web_formulario-DJ" },
      { "source": "/press-kit-web_formulario-DJ/:path*", "destination": "https://nawemedia-onboarding.vercel.app/press-kit-web_formulario-DJ/:path*" },
      { "source": "/virginiasoledispa/", "destination": "https://nawemedia-epks.vercel.app/djs/DJ%20VIRGINIA%20SOLEDISPA%20EPK_V02/index.html" },
      { "source": "/virginiasoledispa/:path*", "destination": "https://nawemedia-epks.vercel.app/djs/DJ%20VIRGINIA%20SOLEDISPA%20EPK_V02/:path*" }
    ]
  }
  ```
  - No hay `trailingSlash` ni `cleanUrls` configurados → explica la duplicación con/sin barra final (sección 5, grupo B).
  - El redirect de `/virginiasoledispa` usa `"permanent": false` → devuelve **HTTP 307** (temporal), verificado por curl. Para una normalización de URL que es permanente por diseño, Google recomienda 301/308 (`"permanent": true`), no 307 — un redirect temporal transmite menos autoridad/señal de consolidación al motor de búsqueda.
  - Los 2 `rewrites` sirven contenido de otro dominio bajo una URL de `nawemedia.com`, generando la duplicación cross-domain de la sección 5, grupo E.
- **Dominios verificados por HTTP (HECHO):**
  - `http://www.nawemedia.com/` → 308 → `https://www.nawemedia.com/` ✅ correcto
  - `http://nawemedia.com/` → 308 → `https://nawemedia.com/` ✅ correcto (pero se queda en non-www, no salta a www)
  - `https://www.nawemedia.com/` → 200 ✅
  - `https://nawemedia.com/` → **200, sin redirect a www**, mismo `etag`/contenido byte-a-byte que la versión www (confirmado por `md5sum`) → **duplicación de dominio real, no teórica**
- **Deployments/preview expuestos:** no se detectaron URLs `*.vercel.app` propias de **este** proyecto expuestas en el código (no hay dominio tipo `nawemedia-web-xxxx.vercel.app` referenciado). Los únicos `*.vercel.app` presentes son los de **otros** proyectos (`nawemedia-epks`, `nawemedia-onboarding`) usados vía `rewrites`, ya cubiertos arriba. **NO CONFIRMADO:** si el proyecto de Vercel de `nawemedia-web` tiene su URL de producción por defecto (`nawemedia-web.vercel.app` o similar) activa y rastreable — no se pudo verificar el nombre exacto del proyecto en Vercel desde el código; si existe, es candidata a otro duplicado cross-domain igual que el grupo E.
- **Rutas antiguas activas:** `git log` muestra iteraciones de "Electric Side" (V4 → V07) y del checkout de Lombardi/Press Kit Web sin indicios de rutas viejas abandonadas físicamente en el árbol actual — el repo solo contiene la versión vigente de cada carpeta. No se detectaron rutas "fantasma".

## 10. Problemas críticos (P0)

1. **`/presupuesto/` y `/demos/savori-pedidos-hub.html` sin canonical, sin metadata, compartiendo shell de bundler idéntico** — las 2 únicas URLs de contenido real del sitemap además de la home, y la causa mejor evidenciada del aviso de GSC. *(Fase 4/5, grupo A)*
2. **`/electric-side/` indexable sin `noindex` ni protección**, herramienta interna de gestión de un cliente expuesta como página pública normal, duplicada además con/sin trailing slash. *(Fase 3.1, Fase 4)*
3. **Duplicación sistemática por trailing slash** en toda ruta tipo carpeta, sin redirect — confirmado por HTTP en múltiples rutas, sin `trailingSlash` configurado en `vercel.json`. *(Fase 5, grupo B)*
4. **Duplicación `www` / `non-www`** — `nawemedia.com` sirve 200 con contenido idéntico a `www.nawemedia.com`, sin redirect (mitigado solo en la home por canonical hardcodeado; sin mitigar en el resto). *(Fase 5, grupo C)*
5. **Duplicación cross-domain vía `rewrites`** — `/virginiasoledispa/` y `/press-kit-web_formulario-DJ` sirven contenido idéntico al de `nawemedia-epks.vercel.app` y `nawemedia-onboarding.vercel.app` respectivamente, sin canonical en ningún lado, y esos dominios no tienen `robots.txt` propio. *(Fase 5, grupo E; Fase 9)*

## 11. Problemas importantes (P1)

1. `/case-study/miculka/` sin canonical, sin metadata (solo title), huérfana de navegación interna y ausente del sitemap, pese a ser contenido único y comercialmente relevante.
2. Redirect de `/virginiasoledispa` configurado como temporal (307/`permanent:false`) en vez de permanente (301/308).
3. `/presupuesto/` está embebida como iframe en la home **y** publicada como URL indexable independiente al mismo tiempo, sin que el código deje explícita la intención (¿debe indexarse sola o no?).

## 12. Problemas menores (P2/P3)

1. `Disallow: /admin-facturas/` en `robots.txt` combinado con `noindex` en el HTML de esas páginas — señal contradictoria (Fase 7).
2. `presupuesto/index.html` y `demos/savori-pedidos-hub.html` tienen `<html>` sin atributo `lang` (el resto del sitio sí lo declara).
3. Depender solo del canonical hardcodeado de la home para resolver `www`/`non-www`, en vez de también normalizar por redirect de dominio a nivel de Vercel — funciona hoy, pero es frágil (cualquier página nueva sin canonical vuelve a exponer el problema).
4. `filmbase-leo/index.html` en `lang="en"` mientras el resto del sitio es `es` — intencional, se deja documentado, no requiere acción salvo que se decida lo contrario.

## 13. Correcciones recomendadas, ordenadas por prioridad

| # | Corrección | Prioridad | Archivo(s) | Riesgo de la corrección |
|---|---|---|---|---|
| 1 | Agregar `<link rel="canonical">` autorreferencial + `<meta name="description">` + `lang="es"` al wrapper estático de `presupuesto/index.html` y `demos/savori-pedidos-hub.html` (sin tocar el bundle/template embebido) | P0 | `sitio/presupuesto/index.html`, `sitio/demos/savori-pedidos-hub.html` | **Bajo** — son adiciones de tags en el `<head>` estático, no tocan la lógica de desempaquetado ni el contenido dinámico |
| 2 | Decidir y aplicar: `noindex` en `/presupuesto/` (si su único rol es ser el iframe embebido) **o** sacarla del iframe y tratarla como página standalone con metadata completa | P0 | `sitio/presupuesto/index.html`, `sitio/index.html` | **Bajo-Medio** — depende de la decisión de producto; requiere confirmación del usuario, no es solo técnico |
| 3 | Agregar `<meta name="robots" content="noindex">` a `/electric-side/index.html` | P0 | `sitio/electric-side/index.html` | **Bajo** — una línea; evaluar en paralelo (fuera de SEO) si además necesita autenticación |
| 4 | Configurar `"trailingSlash"` en `sitio/vercel.json` (`true` o `false`, a elegir) para eliminar la duplicación con/sin barra final en todo el sitio | P0 | `sitio/vercel.json` | **Medio** — afecta el comportamiento de enlace de *todas* las rutas tipo carpeta; requiere revisar que ningún link interno quede roto tras el cambio (ver plan de validación) |
| 5 | Redirigir `nawemedia.com` → `www.nawemedia.com` a nivel de configuración de dominio en Vercel (no código) | P0 | Config de dominio en Vercel (fuera del repo) | **Medio** — cambio de infraestructura, no de código; requiere acceso al dashboard de Vercel |
| 6 | Resolver la duplicación cross-domain de `/virginiasoledispa/` y `/press-kit-web_formulario-DJ`: canonicalizar o `noindex` en `nawemedia-epks.vercel.app` / `nawemedia-onboarding.vercel.app` | P0 | Repos externos `nawemedia-epks` y `nawemedia-onboarding` (**fuera de `nawemedia-web`**) | **Medio** — toca otro repo/proyecto, coordinar por separado |
| 7 | Agregar canonical + metadata mínima a `/case-study/miculka/`, decidir si suma al sitemap y si se enlaza desde la home | P1 | `sitio/case-study/miculka/index.html`, `sitio/sitemap.xml`, `sitio/index.html` | **Bajo** |
| 8 | Cambiar el redirect de `/virginiasoledispa` a `"permanent": true` en `vercel.json` | P1 | `sitio/vercel.json` | **Bajo** |
| 9 | Quitar `Disallow: /admin-facturas/` de `robots.txt` (dejar que el `noindex` haga el trabajo) **o** quitar el meta `noindex` de esas páginas (dejar que `robots.txt` haga el trabajo) — elegir una sola señal | P2 | `sitio/robots.txt` o `sitio/admin-facturas/*.html` | **Bajo** |
| 10 | Agregar `lang="es"` al `<html>` de `presupuesto/index.html` y `demos/savori-pedidos-hub.html` | P2 | Mismos archivos del punto 1 | **Bajo** |

## 14. Archivos que habría que modificar

- `sitio/presupuesto/index.html`
- `sitio/demos/savori-pedidos-hub.html`
- `sitio/electric-side/index.html`
- `sitio/case-study/miculka/index.html`
- `sitio/vercel.json`
- `sitio/sitemap.xml` (si se decide sumar `/case-study/miculka/`)
- `sitio/index.html` (solo si se decide sacar `/presupuesto/` del iframe)
- `sitio/robots.txt` (punto 9, opcional)
- Configuración de dominio en el proyecto de Vercel (fuera del repo, vía dashboard/API de Vercel)
- Repos `nawemedia-epks` y `nawemedia-onboarding` (fuera de `nawemedia-web`, requieren su propia auditoría puntual para el punto 6)

## 15. Riesgo de cada corrección

Ya detallado por ítem en la tabla de la sección 13, columna "Riesgo de la corrección". En resumen: los cambios de metadata (canonical, description, lang, noindex) son de **riesgo bajo** — son adiciones de tags que no alteran funcionalidad. El único cambio de **riesgo medio** dentro de este repo es `trailingSlash` en `vercel.json`, porque toca el comportamiento de ruteo de todo el sitio y debería probarse en preview de Vercel antes de ir a producción. Los cambios de dominio (`www`/`non-www`) y los que tocan otros repos quedan fuera del control de un solo commit y requieren coordinación aparte.

## 16. Plan de implementación (propuesto, no ejecutado)

1. **P0 de metadata (ítems 1, 3, 7, 10 de la sección 13)** — cambios aislados, un commit por archivo o un commit agrupado, sin dependencias entre sí. Pueden implementarse primero.
2. **Decisión de producto sobre `/presupuesto/`** (ítem 2) — requiere que el usuario defina si el cotizador debe indexarse como página propia o quedar solo como componente embebido. Bloqueante para saber si el canonical del ítem 1 debe ser autorreferencial o si en cambio corresponde `noindex`.
3. **`trailingSlash` en `vercel.json`** (ítem 4) — probar en un deploy preview de Vercel antes de mergear a producción; revisar que no rompa los `rewrites`/`redirects` existentes (`virginiasoledispa`, `press-kit-web_formulario-DJ`).
4. **Redirect `permanent: true`** (ítem 8) — va junto con el punto anterior, mismo archivo.
5. **Dominio `www`/`non-www`** (ítem 5) — coordinar por separado en el dashboard de Vercel, fuera de este repo.
6. **Cross-domain `virginiasoledispa` / `press-kit-web_formulario-DJ`** (ítem 6) — abrir como tarea en los repos `nawemedia-epks` / `nawemedia-onboarding`.
7. **`robots.txt` de `admin-facturas`** (ítem 9) — bajo impacto, se puede hacer en cualquier momento.

## 17. Plan de validación posterior

Una vez aplicadas las correcciones:

1. `curl -I` sobre cada URL corregida para confirmar el status code esperado (200 con canonical presente, o 301/308 en los redirects nuevos).
2. Repetir la verificación de `diff` entre variantes con/sin `www` y con/sin trailing slash para confirmar que ya no hay 2 URLs con 200 + contenido idéntico sin redirect.
3. Validar el HTML renderizado (no solo el fuente) de `/presupuesto/` y `/demos/savori-pedidos-hub.html` con una herramienta que ejecute JS (ej. "Inspeccionar URL" de GSC, o Lighthouse/Puppeteer) para confirmar que el canonical agregado en el wrapper estático sigue presente después de que el bundle se desempaqueta (el JS no debería pisar el `<head>`, pero conviene confirmarlo).
4. En Google Search Console: usar "Inspeccionar URL" sobre cada URL de la sección 18 y solicitar reindexación de las que cambiaron.
5. Esperar el próximo ciclo de recrawl (días a 1-2 semanas) y confirmar en el informe de Cobertura que el clúster "Duplicada, sin canonical" se reduce o desaparece.
6. Confirmar que `sitemap.xml` sigue siendo válido (XML bien formado) y que todas sus URLs siguen devolviendo 200 tras los cambios de `trailingSlash`.

## 18. URLs para inspeccionar manualmente en Google Search Console

Priorizadas por probabilidad de ser las URLs exactas detrás de los 2 avisos:

1. `https://www.nawemedia.com/presupuesto/`
2. `https://www.nawemedia.com/demos/savori-pedidos-hub.html`
3. `https://nawemedia.com/presupuesto/` (variante non-www, si GSC la trackea como URL separada)
4. `https://nawemedia.com/demos/savori-pedidos-hub.html`
5. `https://www.nawemedia.com/electric-side` y `https://www.nawemedia.com/electric-side/`
6. `https://www.nawemedia.com/virginiasoledispa/` y `https://nawemedia-epks.vercel.app/djs/DJ%20VIRGINIA%20SOLEDISPA%20EPK_V02/index.html`
7. `https://www.nawemedia.com/press-kit-web_formulario-DJ` y `https://nawemedia-onboarding.vercel.app/press-kit-web_formulario-DJ`
8. `https://www.nawemedia.com/case-study/miculka/` y `https://www.nawemedia.com/case-study/miculka`
9. `https://nawemedia.com/` (confirmar cómo la está tratando GSC frente a `https://www.nawemedia.com/`)

Para cada una, en GSC → Inspección de URLs, confirmar: URL canónica declarada por el usuario vs. URL canónica seleccionada por Google — esa comparación es la que va a confirmar o descartar definitivamente la Fase 2 de esta auditoría, ya que esta sesión no tuvo acceso directo a Search Console.

---

*Fin del informe. No se realizaron cambios de código, commits, ni modificaciones de configuración de Vercel — esta auditoría es de solo lectura, tal como se solicitó.*
