import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listSites, renderSitesSummary } from '../lib/gscSites.mjs';

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
  const summary = renderSitesSummary(
    [
      { siteUrl: 'sc-domain:nawemedia.com', permissionLevel: 'siteFullUser' },
      { siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteOwner' },
    ],
    { gscSiteUrl: 'sc-domain:nawemedia.com' },
  );
  assert.match(summary, /sc-domain:nawemedia\.com.*✅/);
  assert.doesNotMatch(summary.split('\n').find((l) => l.includes('www.nawemedia.com')), /✅/);
});

test('renderSitesSummary avisa si el gscSiteUrl configurado no aparece en la lista', () => {
  const summary = renderSitesSummary(
    [{ siteUrl: 'https://www.nawemedia.com/', permissionLevel: 'siteOwner' }],
    { gscSiteUrl: 'sc-domain:nawemedia.com' },
  );
  assert.match(summary, /no aparece en la tabla/);
});

test('renderSitesSummary avisa si la lista viene vacía', () => {
  const summary = renderSitesSummary([], { gscSiteUrl: 'sc-domain:nawemedia.com' });
  assert.match(summary, /lista vacía/);
});

test('renderSitesSummary muestra el error tal cual si sites.list falló', () => {
  const summary = renderSitesSummary([], { error: 'Search Console API (sites.list) 403: forbidden' });
  assert.match(summary, /403/);
});
