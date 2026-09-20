// nawemedia-com es el sitio original del monitor (antes de volverse
// multi-sitio): su issue de regresión (#40) y el de escalamiento ya viven
// en GitHub con el marker/título sin sufijo de sitio. Para no perder esa
// continuidad (y no abrir un duplicado huérfano), nawemedia-com sigue
// usando exactamente esos literales. Cualquier sitio nuevo recibe un
// marker/título propio con su id — así cada sitio tiene su propio hilo de
// issue, separado y deduplicado del resto.
const LEGACY_SITE_ID = 'nawemedia-com';

const LEGACY_REGRESSION_MARKER = '<!-- seo-monitor:managed-issue -->';
const LEGACY_REGRESSION_TITLE = 'SEO monitor: regresión detectada en URLs corregidas';
const LEGACY_ESCALATION_MARKER = '<!-- seo-monitor:recrawl-escalation-issue -->';
const LEGACY_ESCALATION_TITLE = 'seo-monitor: recrawl pendiente por más de 30 días';

export function regressionMarker(siteId) {
  return siteId === LEGACY_SITE_ID ? LEGACY_REGRESSION_MARKER : `<!-- seo-monitor:managed-issue:${siteId} -->`;
}

export function regressionTitle(site) {
  return site.id === LEGACY_SITE_ID ? LEGACY_REGRESSION_TITLE : `SEO monitor: regresión detectada en ${site.label}`;
}

export function escalationMarker(siteId) {
  return siteId === LEGACY_SITE_ID ? LEGACY_ESCALATION_MARKER : `<!-- seo-monitor:recrawl-escalation-issue:${siteId} -->`;
}

export function escalationTitle(site) {
  return site.id === LEGACY_SITE_ID
    ? LEGACY_ESCALATION_TITLE
    : `seo-monitor: recrawl pendiente por más de 30 días — ${site.label}`;
}
