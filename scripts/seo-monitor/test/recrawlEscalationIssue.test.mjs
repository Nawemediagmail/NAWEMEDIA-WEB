import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncRecrawlEscalationIssue, renderEscalationBody } from '../lib/recrawlEscalationIssue.mjs';

const REPO = 'Nawemediagmail/NAWEMEDIA-WEB';
const MARKER = '<!-- seo-monitor:recrawl-escalation-issue -->';
const REGRESSION_MARKER = '<!-- seo-monitor:managed-issue -->';

const escalation = {
  id: 'demos-savori',
  label: 'Demo Savori',
  path: '/demos/savori-pedidos-hub.html',
  url: 'https://www.nawemedia.com/demos/savori-pedidos-hub.html',
  expectedCanonical: 'https://www.nawemedia.com/demos/savori-pedidos-hub.html',
  googleCanonical: 'https://nawemedia.com/demos/savori-pedidos-hub.html',
  coverageState: 'Duplicada: el usuario no ha indicado ninguna versión canónica',
  lastCrawlTime: '2026-10-20T00:00:00Z',
  canonicalFixedAt: '2026-09-15T22:24:23Z',
  daysSinceFixed: 35,
  thresholdDays: 30,
};

function makeFetch({ existingIssues = [] } = {}) {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method ?? 'GET', body: opts.body ? JSON.parse(opts.body) : null });
    const u = String(url);
    if (opts.method === undefined || opts.method === 'GET') {
      return new Response(JSON.stringify(existingIssues), { status: 200 });
    }
    if (opts.method === 'POST' && u.endsWith('/issues')) {
      return new Response(JSON.stringify({ number: 101 }), { status: 201 });
    }
    if (opts.method === 'PATCH') {
      return new Response(JSON.stringify({ number: Number(u.split('/').at(-1)) }), { status: 200 });
    }
    if (opts.method === 'POST' && u.includes('/comments')) {
      return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    }
    throw new Error(`mock sin manejar: ${opts.method} ${u}`);
  };
  return { fetchImpl, calls };
}

test('sin escalamientos y sin issue previo: no hace nada', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [] });
  const result = await syncRecrawlEscalationIssue({ repo: REPO, token: 't', escalations: [], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'none');
  assert.ok(!calls.some((c) => c.method === 'POST' || c.method === 'PATCH'));
});

test('sin escalamientos y con issue previo abierto: lo cierra y comenta', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [{ number: 12, body: `${MARKER}\nviejo` }] });
  const result = await syncRecrawlEscalationIssue({ repo: REPO, token: 't', escalations: [], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'closed');
  assert.equal(result.number, 12);
  const patch = calls.find((c) => c.method === 'PATCH');
  assert.equal(patch.body.state, 'closed');
  assert.ok(calls.some((c) => c.method === 'POST' && c.url.includes('/comments')));
});

test('con escalamientos y sin issue previo: crea uno nuevo con label seo-monitor y marker propio', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [] });
  const result = await syncRecrawlEscalationIssue({ repo: REPO, token: 't', escalations: [escalation], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'created');
  const create = calls.find((c) => c.method === 'POST' && c.url.endsWith('/issues'));
  assert.ok(create);
  assert.deepEqual(create.body.labels, ['seo-monitor']);
  assert.equal(create.body.title, 'seo-monitor: recrawl pendiente por más de 30 días');
  assert.match(create.body.body, new RegExp(MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('con escalamientos y con issue previo abierto (mismo marker): actualiza, no crea otro', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [{ number: 13, body: `${MARKER}\nviejo` }] });
  const result = await syncRecrawlEscalationIssue({ repo: REPO, token: 't', escalations: [escalation], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'updated');
  assert.equal(result.number, 13);
  assert.ok(!calls.some((c) => c.method === 'POST' && c.url.endsWith('/issues')));
});

test('no se confunde con el issue de regresiones (marker distinto): lo ignora y crea el propio', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [{ number: 40, body: `${REGRESSION_MARKER}\nregresión sin relación` }] });
  const result = await syncRecrawlEscalationIssue({ repo: REPO, token: 't', escalations: [escalation], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'created');
  assert.notEqual(result.number, 40);
  const create = calls.find((c) => c.method === 'POST' && c.url.endsWith('/issues'));
  assert.ok(create);
});

test('marker/title parametrizados (motor multi-sitio): produce un issue separado del marker por defecto', async () => {
  const siteMarker = '<!-- seo-monitor:recrawl-escalation-issue:miculka-logistica -->';
  const { fetchImpl, calls } = makeFetch({ existingIssues: [{ number: 55, body: `${MARKER}\n(issue del otro sitio, marker por defecto)` }] });
  const result = await syncRecrawlEscalationIssue({
    repo: REPO, token: 't', escalations: [escalation], runUrl: 'https://x', fetchImpl,
    marker: siteMarker, title: 'seo-monitor: recrawl pendiente — Miculka Logística',
  });
  assert.equal(result.action, 'created');
  assert.notEqual(result.number, 55);
  const create = calls.find((c) => c.method === 'POST' && c.url.endsWith('/issues'));
  assert.equal(create.body.title, 'seo-monitor: recrawl pendiente — Miculka Logística');
  assert.match(create.body.body, /miculka-logistica/);
});

test('sin marker/title explícitos: usa los valores por defecto (comportamiento legacy de nawemedia.com)', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [] });
  await syncRecrawlEscalationIssue({ repo: REPO, token: 't', escalations: [escalation], runUrl: 'https://x', fetchImpl });
  const create = calls.find((c) => c.method === 'POST' && c.url.endsWith('/issues'));
  assert.equal(create.body.title, 'seo-monitor: recrawl pendiente por más de 30 días');
  assert.match(create.body.body, /<!-- seo-monitor:recrawl-escalation-issue -->/);
});

test('el body incluye URL, canonicals, coverageState, lastCrawlTime, canonicalFixedAt y días transcurridos', () => {
  const body = renderEscalationBody([escalation], 'https://x/run/1');
  assert.match(body, /https:\/\/www\.nawemedia\.com\/demos\/savori-pedidos-hub\.html/);
  assert.match(body, new RegExp(escalation.expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(body, new RegExp(escalation.googleCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(body, /Duplicada: el usuario no ha indicado/);
  assert.match(body, /2026-10-20T00:00:00Z/);
  assert.match(body, /2026-09-15T22:24:23Z/);
  assert.match(body, /35 \(umbral: 30\)/);
});
