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

- **fail** (rompe el job / bloquea el PR): HTTP, redirect, canonical,
  robots o sitemap incorrectos; una URL indexable sin declarar; GSC
  todavía marcando `coverageState` como "duplicada, sin canonical".
- **warn** (solo informativo, no rompe nada): Search Console todavía sin
  `lastCrawlTime`/`googleCanonical` para una URL — es esperable los
  primeros días después de un fix, antes de que Google recrawlee.

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

`monitored-urls.json` asume una propiedad de dominio verificada en
Search Console (`sc-domain:nawemedia.com`, cubre www/non-www y http/https
en un solo lugar). Si la propiedad verificada es de tipo prefijo de URL
en cambio, cambiar ese valor a `https://www.nawemedia.com/` — no requiere
tocar código, solo el JSON.
