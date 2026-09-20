import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSite, loadSites, PROFILES } from '../lib/sitesConfig.mjs';

function publicSeoSite(overrides = {}) {
  return {
    id: 'site-a', label: 'Site A', profile: 'public-seo', baseUrl: 'https://a.example.com',
    gscSiteUrl: 'https://a.example.com/',
    urls: [{ id: 'home', label: 'Home', path: '/', expectedFinalStatus: 200 }],
    robotsTxt: { path: '/robots.txt', expectedFinalStatus: 200 },
    ...overrides,
  };
}

function privateAppSite(overrides = {}) {
  return {
    id: 'site-b', label: 'Site B', profile: 'private-app', baseUrl: 'https://b.example.com',
    urls: [{ id: 'root', label: 'Root', path: '/', expectedFinalStatus: [401, 403] }],
    robotsTxt: { path: '/robots.txt', expectedFinalStatus: 200, mustDisallow: ['/'] },
    ...overrides,
  };
}

test('PROFILES expone exactamente public-seo y private-app', () => {
  assert.deepEqual(PROFILES, ['public-seo', 'private-app']);
});

test('sitio public-seo válido: no lanza', () => {
  assert.doesNotThrow(() => validateSite(publicSeoSite()));
});

test('sitio private-app válido: no lanza', () => {
  assert.doesNotThrow(() => validateSite(privateAppSite()));
});

test('public-seo sin gscSiteUrl: lanza', () => {
  const site = publicSeoSite();
  delete site.gscSiteUrl;
  assert.throws(() => validateSite(site), /gscSiteUrl/);
});

test('private-app con gscSiteUrl declarado: lanza (evita tratar una app privada como sitio SEO público)', () => {
  const site = privateAppSite({ gscSiteUrl: 'https://b.example.com/' });
  assert.throws(() => validateSite(site), /gscSiteUrl/);
});

test('private-app con sitemap declarado: lanza', () => {
  const site = privateAppSite({ sitemap: { path: '/sitemap.xml', expectedFinalStatus: 200 } });
  assert.throws(() => validateSite(site), /sitemap/);
});

test('profile desconocido: lanza', () => {
  const site = publicSeoSite({ profile: 'algo-raro' });
  assert.throws(() => validateSite(site), /profile/);
});

test('sin urls: lanza', () => {
  const site = publicSeoSite({ urls: [] });
  assert.throws(() => validateSite(site), /urls/);
});

test('sin robotsTxt: lanza', () => {
  const site = publicSeoSite();
  delete site.robotsTxt;
  assert.throws(() => validateSite(site), /robotsTxt/);
});

test('sin id/label/baseUrl: lanza con los tres motivos', () => {
  const site = publicSeoSite();
  delete site.id;
  delete site.label;
  delete site.baseUrl;
  assert.throws(() => validateSite(site), /"id".*"label".*"baseUrl"|id.*label.*baseUrl/s);
});

test('loadSites: lee, ordena alfabéticamente y valida todos los *.json de un directorio', () => {
  const files = {
    'b-site.json': JSON.stringify(publicSeoSite({ id: 'b-site' })),
    'a-site.json': JSON.stringify(privateAppSite({ id: 'a-site' })),
    'readme.md': 'no es json, debe ignorarse',
  };
  const sites = loadSites('/fake/dir', {
    readdirSync: () => Object.keys(files),
    readFileSync: (path) => files[path.split('/').pop()],
  });
  assert.deepEqual(sites.map((s) => s.id), ['a-site', 'b-site']);
});

test('loadSites: id duplicado entre archivos lanza', () => {
  const files = {
    'one.json': JSON.stringify(publicSeoSite({ id: 'dup' })),
    'two.json': JSON.stringify(privateAppSite({ id: 'dup' })),
  };
  assert.throws(
    () => loadSites('/fake/dir', { readdirSync: () => Object.keys(files), readFileSync: (path) => files[path.split('/').pop()] }),
    /duplicado/,
  );
});

test('loadSites: un sitio inválido en el directorio hace fallar la carga completa', () => {
  const invalid = privateAppSite({ gscSiteUrl: 'https://b.example.com/' });
  const files = { 'bad.json': JSON.stringify(invalid) };
  assert.throws(
    () => loadSites('/fake/dir', { readdirSync: () => Object.keys(files), readFileSync: (path) => files[path.split('/').pop()] }),
    /gscSiteUrl/,
  );
});

test('loadSites: contra los sites/*.json reales del repo, todos validan', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sitesDir = join(__dirname, '..', 'sites');
  const sites = loadSites(sitesDir, { readdirSync, readFileSync });
  assert.ok(sites.length >= 3);
  assert.ok(sites.some((s) => s.id === 'nawemedia-com' && s.profile === 'public-seo'));
  assert.ok(sites.some((s) => s.id === 'ops-nawemedia' && s.profile === 'private-app'));
});
