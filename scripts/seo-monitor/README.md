# SEO monitor

Motor multi-sitio: monitorea en producción, por sitio configurado en
`sites/*.json`, según su **perfil** (`public-seo` o `private-app`), y avisa
si algo regresa a estar mal. Nació monitoreando solo `nawemedia.com` (ver
`docs/seo/NAWEMEDIA_SEO_CANONICAL_AUDIT_2026.md`); esa configuración migró
tal cual a `sites/nawemedia-com.json` sin cambiar su comportamiento.

## Sitios configurados

| Sitio | `id` | Perfil | Qué es |
|---|---|---|---|
| `www.nawemedia.com` | `nawemedia-com` | `public-seo` | Sitio público de NAWEMEDIA. Código en `sitio/` de este repo. |
| `miculkalogisticasrl.com` | `miculka-logistica` | `public-seo` | Sitio público de Miculka Logística. No tiene código en este repo — se monitorea 100% por HTTP externo. |
| `ops.nawemedia.com` | `ops-nawemedia` | `private-app` | App interna (NextAuth) — **no** es un sitio SEO público, no debe aparecer indexada en Google. |

## Perfiles

- **`public-seo`** (HTTP/redirect/canonical/robots-meta en vivo, robots.txt,
  sitemap.xml, Search Console, tabla de recrawl aging y su escalamiento):
  requiere `gscSiteUrl`. Pensado para un sitio de marketing/contenido que
  sí debe indexarse.
- **`private-app`** (disponibilidad, redirect de autenticación, noindex,
  headers de seguridad): **no** admite `gscSiteUrl` ni `sitemap` — la
  validación de `lib/sitesConfig.mjs` rechaza la carga completa si un
  sitio `private-app` los declara. Es la salvaguarda explícita contra el
  riesgo real de este perfil: tratar una app interna como si fuera un
  sitio SEO público.

Los dos perfiles reutilizan exactamente los mismos checks en vivo
(`lib/checkUrl.mjs`, `lib/robotsSitemap.mjs`) — la diferencia entre
perfiles es de **orquestación** (qué se corre para cada sitio en
`run.mjs`), no de un motor de checks distinto por perfil.

## Cómo corre

- **`.github/workflows/seo-monitor.yml`** (sin cambios): cron lunes 12:00
  UTC + `workflow_dispatch` manual. Corre `run.mjs`, que ahora itera todos
  los sitios de `sites/*.json`; consulta la URL Inspection API de Search
  Console vía OIDC solo para los `public-seo` (sin secrets, sin JSON de
  service account — usa `google-github-actions/auth` con Workload Identity
  Federation) y abre/actualiza/cierra un issue de GitHub **por sitio y por
  tipo** (label `seo-monitor` compartido, marker distinto por sitio — ver
  "Issues" más abajo). Escribe un Step Summary agrupado por sitio.
- **`.github/workflows/seo-monitor-checks.yml`** (sin cambios): en cada PR
  que toque `scripts/seo-monitor/**` o cualquier `sitio/**/*.html`. Corre
  los tests unitarios (`node --test`, con fixtures, sin red) y
  `coverage-check.mjs`, que falla el PR si hay una página HTML indexable
  en `sitio/` que no esté declarada en `sites/nawemedia-com.json`.
  `coverage-check.mjs` sigue limitado a ese único sitio: es el único cuyo
  código vive en este repo (`sitio/`) — Miculka Logística y Ops NAWEMEDIA
  no tienen carpeta local que escanear acá.

## Agregar un sitio nuevo (solo configuración, sin tocar código)

1. Crear `sites/<id>.json` con, como mínimo: `id`, `label`, `profile`
   (`public-seo` o `private-app`), `baseUrl`, `urls` (array no vacío) y
   `robotsTxt`.
2. Si es `public-seo`: agregar `gscSiteUrl` (el `siteUrl` verificado en
   Search Console — ver "Sobre `gscSiteUrl`" abajo) y, si corresponde,
   `sitemap`.
3. Si es `private-app`: **no** declarar `gscSiteUrl` ni `sitemap` — la
   carga falla fuerte si lo hacés (a propósito).
4. Cada entrada de `urls` acepta los mismos campos que ya existían para
   nawemedia.com: `expectedFinalStatus` (número o array), `expectedRedirect`
   (`{ to, status }`), `expectedCanonical` (o `canonicalCheck: false`),
   `expectedRobotsMeta`, `expectedRobotsHeaderOn200`, y ahora también
   `expectedHeaders` (headers de seguridad — ver más abajo).
5. Si el sitio tiene código en este repo (poco común — solo nawemedia-com
   por ahora), declarar `localCoverageDir` con la carpeta relativa a
   escanear.
6. `node --test scripts/seo-monitor/test/**/*.test.mjs` y
   `node scripts/seo-monitor/run.mjs` (dry-run local, sin tokens) antes de
   abrir el PR — `run.mjs` valida el schema de todos los sitios al cargar,
   así que un sitio mal declarado hace fallar la corrida entera con un
   mensaje claro, no en silencio.

No hace falta tocar ningún `.mjs` ni el workflow para agregar un sitio.

## Headers de seguridad (`expectedHeaders`)

Nuevo campo opcional por entrada de `urls`, útil sobre todo para
`private-app`. Se verifica sobre la respuesta final, sin importar el
status (un header como HSTS debe estar presente incluso en el redirect de
autenticación, no solo en un 200):

```json
"expectedHeaders": {
  "strict-transport-security": true,
  "x-content-type-options": "nosniff",
  "x-frame-options": ["DENY", "SAMEORIGIN"]
}
```

`true` exige que el header esté presente (cualquier valor); un string
exige coincidencia exacta; un array acepta cualquiera de los valores
listados.

## Severidad

- **fail** (rompe el job / bloquea el PR): HTTP, redirect, canonical,
  robots o headers de seguridad incorrectos **en el HTML/HTTP en vivo**;
  robots.txt o sitemap.xml incorrectos (si el sitio declara sitemap); una
  URL indexable sin declarar (solo aplica al sitio con `localCoverageDir`).
- **warn** (solo informativo, no rompe nada): cualquier hallazgo de
  Search Console — `coverageState` "duplicada", `googleCanonical`/`userCanonical`
  distinto al esperado, o una URL que Google todavía no reconoce. GSC
  recrawlea con retraso propio (días a semanas), desacoplado del momento
  del deploy: los checks de GSC nunca fallan el monitor, solo el chequeo
  del HTML/HTTP en vivo detecta una regresión real nuestra. Cada URL con
  `expectedCanonical` puede declarar además `canonicalFixedAt` (fecha del
  commit que corrigió su canonical); el mensaje del warn distingue
  automáticamente un dato de GSC anterior a esa fecha (recrawl pendiente,
  sin más) de uno posterior que sigue sin coincidir (vale la pena revisar
  a mano si persiste). Solo aplica a sitios `public-seo`.

## Recrawl pendiente por más de 30 días (escalamiento) — solo `public-seo`

Un warn de GSC nunca falla el monitor, pero tampoco debería quedar
pendiente para siempre sin que nadie lo note. Si una URL con
`expectedCanonical` + `canonicalFixedAt` sigue sin confirmar el canonical
en Search Console más de `recrawlEscalationDays` días **después** de
`canonicalFixedAt` (30 por defecto; configurable por URL agregando
`recrawlEscalationDays` a esa entrada), se crea/actualiza un issue de
escalamiento separado del de regresiones (ver "Issues" abajo). Se cierra
solo cuando ninguna URL del sitio supera ya el umbral. Lógica en
`lib/recrawlEscalation.mjs` (pura, sin red, tiempo inyectable).

El Step Summary de cada sitio `public-seo` incluye además una tabla
**"Recrawl aging"**: una fila por cada URL con `canonicalFixedAt`
declarado (esté o no ya resuelta), con días transcurridos, umbral, días
restantes para escalar y estado (🟢 resuelto / 🟡 pendiente / 🔴
escalado). Solo se muestra cuando corrió con `GSC_ACCESS_TOKEN`
configurado.

## Issues: uno por sitio y por tipo, deduplicado

Cada sitio tiene hasta dos issues "vivos" propios (label `seo-monitor`
compartido, identificados por un marker HTML único en el cuerpo — nunca
se duplican):

- **Regresión** (fail): siempre, para cualquier perfil.
- **Recrawl pendiente > umbral**: solo para sitios `public-seo`.

`nawemedia-com` conserva el marker/título original sin sufijo (issue #40
y el de escalamiento ya existían con ese texto exacto antes de que el
motor fuera multi-sitio — cambiarlo habría roto la continuidad y abierto
un duplicado huérfano). Cualquier sitio nuevo recibe un marker con su
`id`, ej. `<!-- seo-monitor:managed-issue:miculka-logistica -->`. Lógica
en `lib/siteIssueMarkers.mjs`.

## Correr localmente

```bash
node --test scripts/seo-monitor/test/**/*.test.mjs   # tests con fixtures, sin red
node scripts/seo-monitor/coverage-check.mjs           # sin red, solo lee sitio/ (nawemedia-com)
node scripts/seo-monitor/run.mjs                      # pega a producción real de TODOS los sitios (HTTP público)
```

`run.mjs` local, sin `GSC_ACCESS_TOKEN`/`GITHUB_TOKEN` en el entorno, corre
los checks de HTTP/canonical/robots/sitemap/headers/cobertura igual para
todos los sitios, pero omite Search Console y la sincronización de issues
(avisa con un warn en vez de fallar) — es el dry-run recomendado antes de
abrir un PR que agregue o modifique un sitio.

## Sobre `gscSiteUrl`

Usar el `siteUrl` de tipo **prefijo de URL** (ej. `https://www.ejemplo.com/`),
no de dominio (`sc-domain:ejemplo.com`) salvo que la propiedad verificada
en Search Console sea explícitamente de dominio — confundir esto fue la
causa real del 403 original en nawemedia.com (`sc-domain:nawemedia.com`
vs. la propiedad real, `https://www.nawemedia.com/`; ver issue #40). El
paso "Preflight Search Console (sites.list)" del workflow corre
`preflight-gsc-sites.mjs`, que ahora compara **todos** los sitios
`public-seo` de una sola vez contra lo que ve la identidad autenticada, y
avisa por sitio si alguno no coincide — sin adivinar. Para
`miculka-logistica`, `gscSiteUrl` se declaró por convención (mismo patrón
que nawemedia.com, no verificado contra la cuenta real de Search Console
al momento de agregarlo); el primer preflight en producción confirma o
corrige.
