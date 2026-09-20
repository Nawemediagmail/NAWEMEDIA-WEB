import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRobotsAndSitemap } from '../lib/robotsSitemap.mjs';

const SITE = 'https://www.example.com';
const config = {
  robotsTxt: {
    path: '/robots.txt', expectedFinalStatus: 200,
    mustDisallow: ['/api/'], mustNotDisallow: ['/admin-facturas/'],
    mustContainSitemap: `${SITE}/sitemap.xml`,
  },
  sitemap: {
    path: '/sitemap.xml', expectedFinalStatus: 200,
    mustContainUrls: [`${SITE}/`, `${SITE}/demos/savori-pedidos-hub.html`],
  },
};

function makeFetch(handlers) {
  return async (url) => handlers[String(url)]();
}

test('robots.txt y sitemap.xml correctos: sin fails', async () => {
  const fetchImpl = makeFetch({
    [`${SITE}/robots.txt`]: () => new Response(`User-agent: *\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml`, { status: 200 }),
    [`${SITE}/sitemap.xml`]: () => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${SITE}/</loc></url><url><loc>${SITE}/demos/savori-pedidos-hub.html</loc></url></urlset>`, { status: 200 }),
  });
  const findings = await checkRobotsAndSitemap(config, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
});

test('robots.txt con Disallow contradictorio de admin-facturas: fail', async () => {
  const fetchImpl = makeFetch({
    [`${SITE}/robots.txt`]: () => new Response(`User-agent: *\nDisallow: /api/\nDisallow: /admin-facturas/\n\nSitemap: ${SITE}/sitemap.xml`, { status: 200 }),
    [`${SITE}/sitemap.xml`]: () => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${SITE}/</loc></url><url><loc>${SITE}/demos/savori-pedidos-hub.html</loc></url></urlset>`, { status: 200 }),
  });
  const findings = await checkRobotsAndSitemap(config, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.match(fails[0].message, /admin-facturas/);
});

test('sitemap.xml sin una URL requerida: fail', async () => {
  const fetchImpl = makeFetch({
    [`${SITE}/robots.txt`]: () => new Response(`User-agent: *\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml`, { status: 200 }),
    [`${SITE}/sitemap.xml`]: () => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${SITE}/</loc></url></urlset>`, { status: 200 }),
  });
  const findings = await checkRobotsAndSitemap(config, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.match(fails[0].message, /savori-pedidos-hub/);
});

test('sitemap.xml con status distinto de 200: fail', async () => {
  const fetchImpl = makeFetch({
    [`${SITE}/robots.txt`]: () => new Response(`User-agent: *\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml`, { status: 200 }),
    [`${SITE}/sitemap.xml`]: () => new Response('not found', { status: 404 }),
  });
  const findings = await checkRobotsAndSitemap(config, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail' && f.check === 'sitemap');
  assert.equal(fails.length, 1);
});

// Perfil private-app (ej. ops.nawemedia.com): sin sitemap declarado — el
// check de sitemap se omite por completo, solo se valida robots.txt.

test('sitio sin config.sitemap (perfil private-app): no chequea sitemap, solo robots.txt', async () => {
  const privateAppConfig = {
    robotsTxt: { path: '/robots.txt', expectedFinalStatus: 200, mustDisallow: ['/'] },
  };
  let sitemapRequested = false;
  const fetchImpl = async (url) => {
    if (String(url).endsWith('/sitemap.xml')) sitemapRequested = true;
    return handlers[String(url)]();
  };
  const handlers = {
    [`${SITE}/robots.txt`]: () => new Response('User-Agent: *\nDisallow: /', { status: 200 }),
  };
  const findings = await checkRobotsAndSitemap(privateAppConfig, SITE, { fetchImpl });
  assert.equal(sitemapRequested, false);
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
  assert.ok(!findings.some((f) => f.check === 'sitemap'));
  assert.ok(findings.some((f) => f.check === 'robots-txt' && f.severity === 'ok'));
});
