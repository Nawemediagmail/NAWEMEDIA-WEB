#!/usr/bin/env node
// Chequeo de cobertura para correr en PR (sin red, sin OIDC): escanea
// sitio/ en busca de páginas HTML indexables que no estén declaradas en
// monitored-urls.json y falla el PR si encuentra alguna. Así, agregar una
// página nueva sin canonical/noindex y sin sumarla al monitor se detecta
// en el momento, no una semana después.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findForgottenUrls } from './lib/coverage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'monitored-urls.json'), 'utf-8'));
const sitioDir = join(__dirname, '..', '..', 'sitio');

const forgotten = findForgottenUrls(sitioDir, config.urls.map((u) => u.path));

const lines = ['# SEO monitor — cobertura de URLs', ''];
if (forgotten.length === 0) {
  lines.push('🟢 Todas las páginas indexables del repo están declaradas en `scripts/seo-monitor/monitored-urls.json`.');
} else {
  lines.push(`🔴 ${forgotten.length} página(s) indexable(s) sin declarar en \`scripts/seo-monitor/monitored-urls.json\`:`, '');
  for (const p of forgotten) lines.push(`- \`${p}\``);
  lines.push(
    '',
    'Agregá cada una a `scripts/seo-monitor/monitored-urls.json` (con su canonical esperado) antes de mergear, ' +
    'o marcala explícitamente con `<meta name="robots" content="noindex,...">` si no debe indexarse.',
  );
}

const summary = lines.join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
}

if (forgotten.length > 0) process.exitCode = 1;
