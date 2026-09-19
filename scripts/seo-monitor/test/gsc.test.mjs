import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectUrl, evaluateGscResult } from '../lib/gsc.mjs';

const entry = { id: 'presupuesto', label: 'Presupuesto', expectedCanonical: 'https://www.example.com/presupuesto/' };

test('coverageState "Duplicada, sin canonical" es fail', () => {
  const findings = evaluateGscResult(entry, {
    coverageState: 'Duplicada, el usuario no ha indicado ninguna versión canónica',
    indexingState: 'INDEXING_ALLOWED',
    googleCanonical: 'https://www.example.com/demos/savori-pedidos-hub.html',
    userCanonical: 'https://www.example.com/presupuesto/',
    lastCrawlTime: '2026-09-10T00:00:00Z',
  });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.ok(fails.some((f) => f.check === 'gsc-coverage'));
});

test('googleCanonical distinto al esperado es fail', () => {
  const findings = evaluateGscResult(entry, {
    coverageState: 'Submitted and indexed',
    indexingState: 'INDEXING_ALLOWED',
    googleCanonical: 'https://www.example.com/demos/savori-pedidos-hub.html',
    userCanonical: 'https://www.example.com/presupuesto/',
    lastCrawlTime: '2026-09-10T00:00:00Z',
  });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.ok(fails.some((f) => f.check === 'gsc-canonical'));
});

test('sin lastCrawlTime / sin googleCanonical todavía: warn, no fail (recrawl pendiente)', () => {
  const findings = evaluateGscResult(entry, {
    coverageState: 'URL is unknown to Google',
    indexingState: 'INDEXING_ALLOWED',
    googleCanonical: null,
    userCanonical: 'https://www.example.com/presupuesto/',
    lastCrawlTime: null,
  });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
  assert.ok(findings.some((f) => f.severity === 'warn'));
});

test('todo correcto: sin fails ni warns de canonical', () => {
  const findings = evaluateGscResult(entry, {
    coverageState: 'Submitted and indexed',
    indexingState: 'INDEXING_ALLOWED',
    googleCanonical: 'https://www.example.com/presupuesto/',
    userCanonical: 'https://www.example.com/presupuesto/',
    lastCrawlTime: '2026-09-15T00:00:00Z',
  });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
  assert.equal(findings.filter((f) => f.severity === 'warn').length, 0);
});

test('indexStatusResult ausente: warn (recrawl pendiente), no fail', () => {
  const findings = evaluateGscResult(entry, null);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'warn');
});

test('inspectUrl manda el bearer token y parsea indexStatusResult', async () => {
  let seenAuth = null;
  const fetchImpl = async (url, opts) => {
    seenAuth = opts.headers.authorization;
    return new Response(JSON.stringify({ inspectionResult: { indexStatusResult: { coverageState: 'Submitted and indexed' } } }), { status: 200 });
  };
  const result = await inspectUrl({ accessToken: 'tok123', siteUrl: 'sc-domain:example.com', inspectionUrl: 'https://www.example.com/', fetchImpl });
  assert.equal(seenAuth, 'Bearer tok123');
  assert.equal(result.coverageState, 'Submitted and indexed');
});

test('inspectUrl lanza error legible si la API responde error', async () => {
  const fetchImpl = async () => new Response('quota exceeded', { status: 429 });
  await assert.rejects(
    () => inspectUrl({ accessToken: 'tok', siteUrl: 'sc-domain:example.com', inspectionUrl: 'https://www.example.com/', fetchImpl }),
    /429/,
  );
});
