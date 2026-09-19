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
