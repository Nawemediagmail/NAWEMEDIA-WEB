# SEO monitor

Monitorea en producción las URLs corregidas en la auditoría de canonicals
(`docs/seo/NAWEMEDIA_SEO_CANONICAL_AUDIT_2026.md`) y avisa si alguna
regresa a estar mal (canonical, HTTP, robots o sitemap incorrectos).

## Cómo corre

- **`.github/workflows/seo-monitor.yml`**: cron lunes 12:00 UTC +
  `workflow_dispatch` manual. Corre `run.mjs` contra
  `https://www.nawemedia.com`, consulta la URL Inspection API de Search
  Console vía OIDC (sin secrets, sin JSON de service account — usa
  `google-github-actions/auth` con Workload Identity Federation) y
  abre/actualiza/cierra un único issue de GitHub (label `seo-monitor`)
  según el resultado. Escribe el resumen en el Step Summary del run.
- **`.github/workflows/seo-monitor-checks.yml`**: en cada PR que toque
  `scripts/seo-monitor/**` o cualquier `sitio/**/*.html`. Corre los tests
  unitarios (`node --test`, con fixtures, sin red) y
  `coverage-check.mjs`, que falla el PR si hay una página HTML indexable
  en `sitio/` que no esté declarada en `monitored-urls.json`.

## Agregar una URL nueva al monitoreo

Sumarla a la lista `urls` en `monitored-urls.json`: `path`,
`expectedFinalStatus`, `expectedCanonical` (o `canonicalCheck: false` si
no aplica, como en rewrites cross-domain) y `expectedRobotsMeta` si debe
llevar `noindex`. Si la página es nueva y **no** se declara, el workflow
de PR (`seo-monitor-checks.yml`) va a fallar solo con el path exacto que
falta — es el mecanismo de "no te olvides de esta".

## Severidad

- **fail** (rompe el job / bloquea el PR): HTTP, redirect, canonical o
  robots incorrectos **en el HTML/HTTP en vivo**; robots.txt o sitemap.xml
  incorrectos; una URL indexable sin declarar.
- **warn** (solo informativo, no rompe nada): cualquier hallazgo de
  Search Console — `coverageState` "duplicada", `googleCanonical`/`userCanonical`
  distinto al esperado, o una URL que Google todavía no reconoce. GSC
  recrawlea con retraso propio (días a semanas), desacoplado del momento
  del deploy: los checks de GSC nunca fallan el monitor, solo el chequeo
  del HTML/HTTP en vivo detecta una regresión real nuestra. Cada URL con
  `expectedCanonical` declara además `canonicalFixedAt` (fecha del commit
  que corrigió su canonical); el mensaje del warn distingue automáticamente
  un dato de GSC anterior a esa fecha (recrawl pendiente, sin más) de uno
  posterior que sigue sin coincidir (vale la pena revisar a mano si persiste).

## Recrawl pendiente por más de 30 días (escalamiento)

Un warn de GSC nunca falla el monitor, pero tampoco debería quedar
pendiente para siempre sin que nadie lo note. Si una URL con
`expectedCanonical` + `canonicalFixedAt` sigue sin confirmar el canonical
en Search Console (sin `lastCrawlTime`, `coverageState` "duplicada" o
`googleCanonical` distinto) más de `recrawlEscalationDays` días **después**
de `canonicalFixedAt` (30 por defecto; configurable por URL agregando
`recrawlEscalationDays` a esa entrada en `monitored-urls.json`), se
crea/actualiza un segundo issue separado, con su propio marker y label
`seo-monitor`: **`seo-monitor: recrawl pendiente por más de 30 días`**.
Se cierra solo cuando ninguna URL supera ya el umbral. Es un único issue
vivo, igual que el de regresiones — nunca se duplica. Lógica en
`lib/recrawlEscalation.mjs` (pura, sin red, tiempo inyectable) y
`lib/recrawlEscalationIssue.mjs` (ciclo de vida del issue, reutiliza
`syncManagedIssue` de `lib/issue.mjs`).

## Correr localmente

```bash
node --test scripts/seo-monitor/test/**/*.test.mjs   # tests con fixtures, sin red
node scripts/seo-monitor/coverage-check.mjs           # sin red, solo lee sitio/
node scripts/seo-monitor/run.mjs                      # pega a producción real (HTTP público)
```

`run.mjs` local, sin `GSC_ACCESS_TOKEN`/`GITHUB_TOKEN` en el entorno,
corre los checks de HTTP/canonical/robots/sitemap/cobertura igual, pero
omite Search Console y la sincronización del issue (avisa con un warn en
vez de fallar).

## Sobre `gscSiteUrl`

`monitored-urls.json` usa `https://www.nawemedia.com/` porque la propiedad
verificada en Search Console es de tipo **prefijo de URL**, no de dominio
(`sc-domain:nawemedia.com` daba 403 en `sites.list` y en la URL Inspection
API — diagnosticado con el preflight de `preflight-gsc-sites.mjs`, ver
issue #40). Si en algún momento se agrega/migra a una propiedad de
dominio, corregir este único valor — no requiere tocar código, solo el
JSON. El paso "Preflight Search Console (sites.list)" del workflow
siempre muestra qué `siteUrl` ve la identidad autenticada, para
verificarlo sin adivinar.
