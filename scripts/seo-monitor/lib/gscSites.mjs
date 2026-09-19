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
