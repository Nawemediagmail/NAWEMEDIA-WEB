import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStepSummary } from '../lib/summary.mjs';

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
