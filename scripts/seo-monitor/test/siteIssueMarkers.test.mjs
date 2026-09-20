import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regressionMarker, regressionTitle, escalationMarker, escalationTitle } from '../lib/siteIssueMarkers.mjs';

test('nawemedia-com conserva el marker/título legacy exacto (continuidad del issue #40)', () => {
  const site = { id: 'nawemedia-com', label: 'NAWEMEDIA (www.nawemedia.com)' };
  assert.equal(regressionMarker('nawemedia-com'), '<!-- seo-monitor:managed-issue -->');
  assert.equal(regressionTitle(site), 'SEO monitor: regresión detectada en URLs corregidas');
  assert.equal(escalationMarker('nawemedia-com'), '<!-- seo-monitor:recrawl-escalation-issue -->');
  assert.equal(escalationTitle(site), 'seo-monitor: recrawl pendiente por más de 30 días');
});

test('un sitio nuevo recibe marker/título propio, con su id, distinto del legacy', () => {
  const site = { id: 'miculka-logistica', label: 'Miculka Logística (miculkalogisticasrl.com)' };
  assert.equal(regressionMarker('miculka-logistica'), '<!-- seo-monitor:managed-issue:miculka-logistica -->');
  assert.match(regressionTitle(site), /Miculka Logística/);
  assert.equal(escalationMarker('miculka-logistica'), '<!-- seo-monitor:recrawl-escalation-issue:miculka-logistica -->');
  assert.match(escalationTitle(site), /Miculka Logística/);
});

test('markers de dos sitios distintos nunca coinciden entre sí ni con el legacy', () => {
  const ids = ['nawemedia-com', 'miculka-logistica', 'ops-nawemedia'];
  const regressionMarkers = ids.map(regressionMarker);
  const escalationMarkers = ids.map(escalationMarker);
  assert.equal(new Set(regressionMarkers).size, 3);
  assert.equal(new Set(escalationMarkers).size, 3);
  for (const m of regressionMarkers) assert.ok(!escalationMarkers.includes(m));
});
