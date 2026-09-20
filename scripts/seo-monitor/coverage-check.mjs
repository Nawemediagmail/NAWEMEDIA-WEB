#!/usr/bin/env node
// Chequeo de cobertura para correr en PR (sin red, sin OIDC): escanea
// sitio/ en busca de páginas HTML indexables que no estén declaradas en
// sites/nawemedia-com.json y falla el PR si encuentra alguna. Así, agregar
// una página nueva sin canonical/noindex y sin sumarla al monitor se
// detecta en el momento, no una semana después. Limitado a nawemedia-com
// (el único sitio cuyo código vive en este repo, sitio/) aunque el motor
// ya sea multi-sitio — los demás sitios no tienen carpeta local que
// escanear acá.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findForgottenUrls } from './lib/coverage.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = 'scripts/seo-monitor/sites/nawemedia-com.json';
const config = JSON.parse(readFileSync(join(__dirname, 'sites', 'nawemedia-com.json'), 'utf-8'));
const sitioDir = join(__dirname, '..', '..', 'sitio');

const forgotten = findForgottenUrls(sitioDir, config.urls.map((u) => u.path));

const lines = ['# SEO monitor — cobertura de URLs', ''];
if (forgotten.length === 0) {
  lines.push(`🟢 Todas las páginas indexables del repo están declaradas en \`${CONFIG_PATH}\`.`);
} else {
  lines.push(`🔴 ${forgotten.length} página(s) indexable(s) sin declarar en \`${CONFIG_PATH}\`:`, '');
  for (const p of forgotten) lines.push(`- \`${p}\``);
  lines.push(
    '',
    `Agregá cada una a \`${CONFIG_PATH}\` (con su canonical esperado) antes de mergear, ` +
    'o marcala explícitamente con `<meta name="robots" content="noindex,...">` si no debe indexarse.',
  );
}

const summary = lines.join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
}

if (forgotten.length > 0) process.exitCode = 1;
