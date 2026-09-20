const SITES_ENDPOINT = 'https://www.googleapis.com/webmasters/v3/sites';

// Webmasters API v3 (Search Console "clásica"): lista qué propiedades puede
// ver la identidad autenticada y con qué nivel de permiso. Usa el mismo
// access token y el mismo scope webmasters.readonly que ya pide el monitor
// para la URL Inspection API — no requiere ningún scope ni credencial nueva.
export async function listSites({ accessToken, fetchImpl = fetch }) {
  const res = await fetchImpl(SITES_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Search Console API (sites.list) ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data?.siteEntry ?? [];
}

// Diagnóstico puro: no evalúa fail/warn, solo muestra qué ve la API para
// que se pueda comparar a mano contra gscSiteUrl en monitored-urls.json.
export function renderSitesSummary(sites, { error, gscSiteUrl } = {}) {
  const lines = ['## SEO monitor — preflight Search Console (sites.list)', ''];

  if (error) {
    lines.push(`🔴 No se pudo listar los sitios accesibles: ${error}`, '');
    return lines.join('\n');
  }

  if (sites.length === 0) {
    lines.push(
      '🔴 La identidad autenticada no tiene acceso a ninguna propiedad de Search Console ' +
      '(sites.list devolvió una lista vacía). El service account no está agregado como ' +
      'usuario en ninguna propiedad, o está agregado en una cuenta de Search Console distinta.',
      '',
    );
    return lines.join('\n');
  }

  lines.push(
    '| siteUrl | permissionLevel | ¿coincide con `gscSiteUrl` en monitored-urls.json? |',
    '|---|---|---|',
  );
  for (const s of sites) {
    const match = gscSiteUrl && s.siteUrl === gscSiteUrl ? '✅' : '';
    lines.push(`| \`${s.siteUrl}\` | \`${s.permissionLevel}\` | ${match} |`);
  }
  lines.push('');

  if (gscSiteUrl && !sites.some((s) => s.siteUrl === gscSiteUrl)) {
    lines.push(
      `🔴 \`${gscSiteUrl}\` (el valor configurado en \`scripts/seo-monitor/monitored-urls.json\`) ` +
      'no aparece en la tabla de arriba — esa es la causa más probable del 403 de la URL ' +
      'Inspection API. Corregir `gscSiteUrl` a uno de los `siteUrl` listados arriba.',
      '',
    );
  }

  return lines.join('\n');
}

// Versión multi-sitio: una sola llamada a sites.list (una identidad ve la
// misma lista sin importar cuántos sitios configurados se estén
// comparando), pero muestra contra cuál(es) sitio(s) declarado(s) coincide
// cada fila, y avisa por separado si el gscSiteUrl de algún sitio
// public-seo no aparece en la lista. Los sitios private-app no tienen
// gscSiteUrl — quedan afuera de la comparación, nunca se los trata como
// sitio SEO público acá tampoco.
export function renderMultiSiteSummary(sites, configuredSites, { error } = {}) {
  const lines = ['## SEO monitor — preflight Search Console (sites.list)', ''];

  if (error) {
    lines.push(`🔴 No se pudo listar los sitios accesibles: ${error}`, '');
    return lines.join('\n');
  }

  const publicSeoSites = configuredSites.filter((s) => s.gscSiteUrl);

  if (sites.length === 0) {
    lines.push(
      '🔴 La identidad autenticada no tiene acceso a ninguna propiedad de Search Console ' +
      '(sites.list devolvió una lista vacía). El service account no está agregado como ' +
      'usuario en ninguna propiedad, o está agregado en una cuenta de Search Console distinta.',
      '',
    );
    return lines.join('\n');
  }

  lines.push(
    '| siteUrl | permissionLevel | coincide con |',
    '|---|---|---|',
  );
  for (const s of sites) {
    const matches = publicSeoSites.filter((cfg) => cfg.gscSiteUrl === s.siteUrl).map((cfg) => cfg.id);
    lines.push(`| \`${s.siteUrl}\` | \`${s.permissionLevel}\` | ${matches.length ? matches.join(', ') : ''} |`);
  }
  lines.push('');

  for (const cfg of publicSeoSites) {
    if (!sites.some((s) => s.siteUrl === cfg.gscSiteUrl)) {
      lines.push(
        `🔴 \`${cfg.gscSiteUrl}\` (\`gscSiteUrl\` del sitio \`${cfg.id}\`) no aparece en la tabla de arriba ` +
        '— causa más probable de un 403 de la URL Inspection API para ese sitio.',
        '',
      );
    }
  }

  return lines.join('\n');
}
