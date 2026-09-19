import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findForgottenUrls } from '../lib/coverage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sitioDir = join(__dirname, 'fixtures', 'sitio-sample');

test('detecta la página nueva sin canonical/noindex y no declarada', () => {
  const forgotten = findForgottenUrls(sitioDir, ['/presupuesto/']);
  assert.deepEqual(forgotten, ['/', '/new-page/']);
});

test('no marca como olvidada una página ya declarada', () => {
  const forgotten = findForgottenUrls(sitioDir, ['/', '/presupuesto/', '/new-page/']);
  assert.deepEqual(forgotten, []);
});

test('ignora páginas con noindex aunque no estén declaradas', () => {
  const forgotten = findForgottenUrls(sitioDir, ['/', '/presupuesto/', '/new-page/']);
  assert.ok(!forgotten.includes('/private-page/'));
});
