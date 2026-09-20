import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listSites, renderSitesSummary, renderMultiSiteSummary } from '../lib/gscSites.mjs';

test('listSites manda el bearer token y parsea siteEntry', async () => {
  let seenAuth = null;
  const fetchImpl = async (url, opts) => {
    seenAuth = opts.headers.authorization;
    assert.equal(String(url), 'https://www.googleapis.com/webmasters/v3/sites');
    return new Response(JSON.stringify({
      siteEntry: [
        { siteUrl: 'sc-domain:nawemedia.com', permissionLevel: 'siteFullUser' },
        { siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteOwner' },
      ],
    }), { status: 200 });
  };
  const sites = await listSites({ accessToken: 'tok123', fetchImpl });
  assert.equal(seenAuth, 'Bearer tok123');
  assert.equal(sites.length, 2);
  assert.equal(sites[1].permissionLevel, 'siteOwner');
});

test('listSites lanza error legible si la API responde error', async () => {
  const fetchImpl = async () => new Response('forbidden', { status: 403 });
  await assert.rejects(() => listSites({ accessToken: 'tok', fetchImpl }), /403/);
});

test('listSites devuelve [] si la respuesta no trae siteEntry', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({}), { status: 200 });
  const sites = await listSites({ accessToken: 'tok', fetchImpl });
  assert.deepEqual(sites, []);
});

test('renderSitesSummary marca con ✅ el siteUrl que coincide con gscSiteUrl', () => {
  // Refleja la configuración real corregida: monitored-urls.json usa
  // gscSiteUrl "https://www.nawemedia.com/" (propiedad de prefijo de URL),
  // no "sc-domain:nawemedia.com" (esa fue la causa del 403 en producción).
  const summary = renderSitesSummary(
    [
      { siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteFullUser' },
      { siteUrl: 'sc-domain:nawemedia.com', permissionLevel: 'siteOwner' },
    ],
    { gscSiteUrl: 'https://www.nawemedia.com/' },
  );
  assert.match(summary, /www\.nawemedia\.com\/`.*✅/);
  assert.doesNotMatch(summary.split('\n').find((l) => l.includes('sc-domain:nawemedia.com')), /✅/);
});

test('renderSitesSummary avisa si el gscSiteUrl configurado no aparece en la lista', () => {
  const summary = renderSitesSummary(
    [{ siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteOwner' }],
    { gscSiteUrl: 'https://nawemedia.com/' },
  );
  assert.match(summary, /no aparece en la tabla/);
});

test('renderSitesSummary avisa si la lista viene vacía', () => {
  const summary = renderSitesSummary([], { gscSiteUrl: 'https://www.nawemedia.com/' });
  assert.match(summary, /lista vacía/);
});

test('renderSitesSummary muestra el error tal cual si sites.list falló', () => {
  const summary = renderSitesSummary([], { error: 'Search Console API (sites.list) 403: forbidden' });
  assert.match(summary, /403/);
});

// renderMultiSiteSummary: una sola tabla de sites.list, comparada contra
// el gscSiteUrl de cada sitio public-seo configurado. Los sitios
// private-app (sin gscSiteUrl) quedan fuera de la comparación.

test('renderMultiSiteSummary: marca contra qué sitio(s) configurado(s) coincide cada fila', () => {
  const googleSites = [
    { siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteFullUser' },
    { siteUrl: 'https://www.miculkalogisticasrl.com/', permissionLevel: 'siteOwner' },
  ];
  const configuredSites = [
    { id: 'nawemedia-com', gscSiteUrl: 'https://www.nawemedia.com/' },
    { id: 'miculka-logistica', gscSiteUrl: 'https://www.miculkalogisticasrl.com/' },
    { id: 'ops-nawemedia', profile: 'private-app' },
  ];
  const summary = renderMultiSiteSummary(googleSites, configuredSites);
  assert.match(summary, /nawemedia\.com\/`.*nawemedia-com/);
  assert.match(summary, /miculkalogisticasrl\.com\/`.*miculka-logistica/);
  assert.doesNotMatch(summary, /ops-nawemedia/);
});

test('renderMultiSiteSummary: avisa por separado si el gscSiteUrl de un sitio no aparece en la lista', () => {
  const googleSites = [{ siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteFullUser' }];
  const configuredSites = [
    { id: 'nawemedia-com', gscSiteUrl: 'https://www.nawemedia.com/' },
    { id: 'miculka-logistica', gscSiteUrl: 'https://www.miculkalogisticasrl.com/' },
  ];
  const summary = renderMultiSiteSummary(googleSites, configuredSites);
  assert.match(summary, /miculka-logistica/);
  assert.match(summary, /no aparece en la tabla/);
});

test('renderMultiSiteSummary: sin sitios public-seo configurados, no exige nada (lista vacía de comparación)', () => {
  const googleSites = [{ siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteFullUser' }];
  const configuredSites = [{ id: 'ops-nawemedia', profile: 'private-app' }];
  const summary = renderMultiSiteSummary(googleSites, configuredSites);
  assert.doesNotMatch(summary, /no aparece en la tabla/);
});

test('renderMultiSiteSummary: muestra el error tal cual si sites.list falló', () => {
  const summary = renderMultiSiteSummary([], [{ id: 'a', gscSiteUrl: 'https://a.example.com/' }], { error: '403: forbidden' });
  assert.match(summary, /403/);
});
