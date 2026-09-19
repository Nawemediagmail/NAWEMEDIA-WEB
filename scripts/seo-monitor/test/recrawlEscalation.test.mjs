import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findEscalations } from '../lib/recrawlEscalation.mjs';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FIXED_AT = '2026-09-15T22:24:23Z';

function nowAtDays(days) {
  return new Date(new Date(FIXED_AT).getTime() + days * MS_PER_DAY);
}

const pendingResult = {
  coverageState: 'Duplicada: el usuario no ha indicado ninguna versión canónica',
  indexingState: 'INDEXING_ALLOWED',
  googleCanonical: 'https://example.com/demos/savori-pedidos-hub.html',
  userCanonical: 'https://www.example.com/demos/savori-pedidos-hub.html',
  lastCrawlTime: '2026-09-19T22:13:16Z',
};

const okResult = {
  coverageState: 'Submitted and indexed',
  indexingState: 'INDEXING_ALLOWED',
  googleCanonical: 'https://www.example.com/demos/savori-pedidos-hub.html',
  userCanonical: 'https://www.example.com/demos/savori-pedidos-hub.html',
  lastCrawlTime: '2026-09-19T22:13:16Z',
};

function entry(overrides = {}) {
  return {
    id: 'demos-savori',
    label: 'Demo Savori',
    path: '/demos/savori-pedidos-hub.html',
    expectedCanonical: 'https://www.example.com/demos/savori-pedidos-hub.html',
    canonicalFixedAt: FIXED_AT,
    ...overrides,
  };
}

test('día 29 tras canonicalFixedAt, todavía pendiente: no escala', () => {
  const results = new Map([['demos-savori', pendingResult]]);
  const escalations = findEscalations([entry()], results, { now: nowAtDays(29), siteUrl: 'https://www.example.com' });
  assert.equal(escalations.length, 0);
});

test('día 30 tras canonicalFixedAt, todavía pendiente: escala', () => {
  const results = new Map([['demos-savori', pendingResult]]);
  const escalations = findEscalations([entry()], results, { now: nowAtDays(30), siteUrl: 'https://www.example.com' });
  assert.equal(escalations.length, 1);
  assert.equal(escalations[0].id, 'demos-savori');
  assert.equal(escalations[0].daysSinceFixed, 30);
  assert.equal(escalations[0].thresholdDays, 30);
  assert.equal(escalations[0].url, 'https://www.example.com/demos/savori-pedidos-hub.html');
  assert.equal(escalations[0].expectedCanonical, entry().expectedCanonical);
  assert.equal(escalations[0].googleCanonical, pendingResult.googleCanonical);
  assert.equal(escalations[0].coverageState, pendingResult.coverageState);
  assert.equal(escalations[0].lastCrawlTime, pendingResult.lastCrawlTime);
  assert.equal(escalations[0].canonicalFixedAt, FIXED_AT);
});

test('varias URLs: solo escala la que superó el umbral y sigue pendiente', () => {
  const results = new Map([
    ['demos-savori', pendingResult],
    ['presupuesto', okResult],
    ['home', pendingResult],
  ]);
  const urls = [
    entry({ id: 'demos-savori', canonicalFixedAt: FIXED_AT }),
    entry({ id: 'presupuesto', canonicalFixedAt: FIXED_AT }),
    entry({ id: 'home', canonicalFixedAt: '2026-09-18T00:00:00Z' }),
  ];
  const escalations = findEscalations(urls, results, { now: nowAtDays(30), siteUrl: 'https://www.example.com' });
  assert.deepEqual(escalations.map((e) => e.id), ['demos-savori']);
});

test('sin lastCrawlTime (Google nunca la reconoció) y más de 30 días: escala', () => {
  const results = new Map([['demos-savori', { coverageState: 'URL is unknown to Google', lastCrawlTime: null, googleCanonical: null }]]);
  const escalations = findEscalations([entry()], results, { now: nowAtDays(31), siteUrl: 'https://www.example.com' });
  assert.equal(escalations.length, 1);
  assert.equal(escalations[0].lastCrawlTime, null);
});

test('sin indexStatusResult en absoluto (nunca se inspeccionó) y más de 30 días: escala', () => {
  const results = new Map();
  const escalations = findEscalations([entry()], results, { now: nowAtDays(45), siteUrl: 'https://www.example.com' });
  assert.equal(escalations.length, 1);
  assert.equal(escalations[0].coverageState, null);
});

test('todo correcto (googleCanonical coincide): nunca escala aunque pasen los días', () => {
  const results = new Map([['demos-savori', okResult]]);
  const escalations = findEscalations([entry()], results, { now: nowAtDays(365), siteUrl: 'https://www.example.com' });
  assert.equal(escalations.length, 0);
});

test('URL sin canonicalFixedAt (no aplica, ej. electric-side): nunca escala', () => {
  const results = new Map();
  const noFixedEntry = entry({ canonicalFixedAt: undefined, expectedCanonical: null, canonicalCheck: false });
  const escalations = findEscalations([noFixedEntry], results, { now: nowAtDays(365), siteUrl: 'https://www.example.com' });
  assert.equal(escalations.length, 0);
});

test('recrawlEscalationDays configurable por URL: pisa el default de 30', () => {
  const results = new Map([['demos-savori', pendingResult]]);
  const shortThreshold = entry({ recrawlEscalationDays: 10 });
  assert.equal(findEscalations([shortThreshold], results, { now: nowAtDays(9), siteUrl: 'https://www.example.com' }).length, 0);
  const escalated = findEscalations([shortThreshold], results, { now: nowAtDays(10), siteUrl: 'https://www.example.com' });
  assert.equal(escalated.length, 1);
  assert.equal(escalated[0].thresholdDays, 10);
});
