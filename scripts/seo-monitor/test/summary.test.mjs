import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStepSummary, renderMultiSiteSummary } from '../lib/summary.mjs';

test('cuenta fails/warns/oks y usa el semáforo rojo si hay fails', () => {
  const findings = [
    { check: 'http', severity: 'fail', message: 'a' },
    { check: 'gsc', severity: 'warn', message: 'b' },
    { check: 'canonical', severity: 'ok', message: 'c' },
  ];
  const summary = renderStepSummary({ findings, runUrl: 'https://x/run/1' });
  assert.match(summary, /🔴/);
  assert.match(summary, /1 fail · 1 warn · 1 ok/);
  assert.match(summary, /## Fallos/);
  assert.match(summary, /## Advertencias/);
});

test('semáforo verde sin fails ni warns', () => {
  const findings = [{ check: 'http', severity: 'ok', message: 'todo bien' }];
  const summary = renderStepSummary({ findings, runUrl: 'https://x/run/2' });
  assert.match(summary, /🟢/);
  assert.doesNotMatch(summary, /## Fallos/);
});

test('sin recrawlAging: no muestra la sección "Recrawl aging"', () => {
  const findings = [{ check: 'http', severity: 'ok', message: 'todo bien' }];
  const summary = renderStepSummary({ findings, runUrl: 'https://x/run/3' });
  assert.doesNotMatch(summary, /## Recrawl aging/);
});

test('con recrawlAging: arma la tabla con días transcurridos, umbral, restantes y estado', () => {
  const findings = [{ check: 'http', severity: 'ok', message: 'todo bien' }];
  const recrawlAging = [
    { id: 'demos-savori', label: 'Demo Savori', path: '/demos/savori-pedidos-hub.html', pending: true, escalated: false, daysSinceFixed: 20, thresholdDays: 30, daysRemaining: 10 },
    { id: 'presupuesto', label: 'Presupuesto', path: '/presupuesto/', pending: false, escalated: false, daysSinceFixed: 5, thresholdDays: 30, daysRemaining: null },
    { id: 'home', label: 'Home', path: '/', pending: true, escalated: true, daysSinceFixed: 40, thresholdDays: 30, daysRemaining: 0 },
  ];
  const summary = renderStepSummary({ findings, runUrl: 'https://x/run/4', recrawlAging });
  assert.match(summary, /## Recrawl aging/);
  assert.match(summary, /\| Demo Savori \(`\/demos\/savori-pedidos-hub\.html`\) \| 20 \| 30 \| 10 \| 🟡 pendiente \|/);
  assert.match(summary, /\| Presupuesto \(`\/presupuesto\/`\) \| 5 \| 30 \| — \| 🟢 resuelto \|/);
  assert.match(summary, /\| Home \(`\/`\) \| 40 \| 30 \| 0 \| 🔴 escalado \|/);
});

// renderMultiSiteSummary: agrupa varios sitios en un único summary, con
// una tabla de resumen y una sección H2 por sitio, sin que los findings
// de un sitio se filtren al conteo o al detalle de otro.

test('renderMultiSiteSummary: totaliza fail/warn/ok de todos los sitios y usa semáforo rojo si algún sitio falla', () => {
  const siteResults = [
    { site: { id: 'a', label: 'Sitio A', profile: 'public-seo', baseUrl: 'https://a.example.com' }, findings: [{ check: 'http', severity: 'fail', message: 'roto' }] },
    { site: { id: 'b', label: 'Sitio B', profile: 'private-app', baseUrl: 'https://b.example.com' }, findings: [{ check: 'http', severity: 'ok', message: 'bien' }] },
  ];
  const summary = renderMultiSiteSummary(siteResults, { runUrl: 'https://x/run/1' });
  assert.match(summary, /🔴/);
  assert.match(summary, /1 fail · 0 warn · 1 ok\*\* en total/);
  assert.match(summary, /\| Sitio A \| `public-seo` \| 1 \| 0 \| 0 \|/);
  assert.match(summary, /\| Sitio B \| `private-app` \| 0 \| 0 \| 1 \|/);
});

test('renderMultiSiteSummary: aislamiento — el fail de un sitio no aparece en la sección de otro', () => {
  const siteResults = [
    { site: { id: 'a', label: 'Sitio A', profile: 'public-seo', baseUrl: 'https://a.example.com' }, findings: [{ check: 'http', severity: 'fail', message: 'FALLO-EXCLUSIVO-DE-A' }] },
    { site: { id: 'b', label: 'Sitio B', profile: 'private-app', baseUrl: 'https://b.example.com' }, findings: [{ check: 'http', severity: 'ok', message: 'todo bien en B' }] },
  ];
  const summary = renderMultiSiteSummary(siteResults, { runUrl: 'https://x/run/2' });

  const sectionA = summary.slice(summary.indexOf('## 🔴 Sitio A'), summary.indexOf('## 🟢 Sitio B'));
  const sectionB = summary.slice(summary.indexOf('## 🟢 Sitio B'));

  assert.match(sectionA, /FALLO-EXCLUSIVO-DE-A/);
  assert.doesNotMatch(sectionB, /FALLO-EXCLUSIVO-DE-A/);
});

test('renderMultiSiteSummary: semáforo verde si ningún sitio tiene fail ni warn', () => {
  const siteResults = [
    { site: { id: 'a', label: 'Sitio A', profile: 'public-seo', baseUrl: 'https://a.example.com' }, findings: [{ check: 'http', severity: 'ok', message: 'ok' }] },
  ];
  const summary = renderMultiSiteSummary(siteResults, { runUrl: 'https://x/run/3' });
  assert.match(summary, /🟢/);
});

test('renderMultiSiteSummary: pasa recrawlAging por sitio a su propia sección', () => {
  const siteResults = [
    {
      site: { id: 'a', label: 'Sitio A', profile: 'public-seo', baseUrl: 'https://a.example.com' },
      findings: [{ check: 'http', severity: 'ok', message: 'ok' }],
      recrawlAging: [{ id: 'home', label: 'Home', path: '/', pending: true, escalated: false, daysSinceFixed: 5, thresholdDays: 30, daysRemaining: 25 }],
    },
    {
      site: { id: 'b', label: 'Sitio B', profile: 'private-app', baseUrl: 'https://b.example.com' },
      findings: [{ check: 'http', severity: 'ok', message: 'ok' }],
      recrawlAging: [],
    },
  ];
  const summary = renderMultiSiteSummary(siteResults, { runUrl: 'https://x/run/4' });
  const occurrences = summary.split('## Recrawl aging').length - 1;
  assert.equal(occurrences, 1);
});
