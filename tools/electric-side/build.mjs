#!/usr/bin/env node
// Regenera el bloque base64 embebido en sitio/api/protect-electric-side.js
// a partir de tools/electric-side/source.html (fuente editable, fuera del
// árbol que Vercel deploya -- root directory del proyecto es "sitio").
//
// Uso: node tools/electric-side/build.mjs
//
// Este script NUNCA debe editarse a mano el resultado (el valor de
// ELECTRIC_SIDE_HTML_B64 dentro de protect-electric-side.js). Para cambiar
// el contenido de la app: editar tools/electric-side/source.html y correr
// este script, que reemplaza el bloque generado y verifica el round-trip.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_HTML = path.join(__dirname, 'source.html');
const TARGET_FUNCTION = path.join(__dirname, '..', '..', 'sitio', 'api', 'protect-electric-side.js');

const START_MARKER = '// === GENERATED:ELECTRIC_SIDE_HTML_B64:START ===';
const END_MARKER = '// === GENERATED:ELECTRIC_SIDE_HTML_B64:END ===';

const html = fs.readFileSync(SOURCE_HTML);
const b64 = html.toString('base64');
const generatedBlock = `${START_MARKER}\nconst ELECTRIC_SIDE_HTML_B64 = "${b64}";\n${END_MARKER}`;

const current = fs.readFileSync(TARGET_FUNCTION, 'utf-8');
const pattern = new RegExp(
  `${START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);

if (!pattern.test(current)) {
  console.error(`ERROR: no se encontraron los marcadores ${START_MARKER} / ${END_MARKER} en ${TARGET_FUNCTION}`);
  process.exit(1);
}

const updated = current.replace(pattern, generatedBlock);
fs.writeFileSync(TARGET_FUNCTION, updated);

// Verificacion round-trip: decodificar lo que quedo escrito debe ser
// exactamente igual al source.html original.
const written = fs.readFileSync(TARGET_FUNCTION, 'utf-8');
const match = written.match(/ELECTRIC_SIDE_HTML_B64 = "([^"]+)"/);
const decoded = Buffer.from(match[1], 'base64');

if (!decoded.equals(html)) {
  console.error('ERROR: el round-trip base64 no coincide con source.html. Abortando.');
  process.exit(1);
}

console.log(`OK: ${TARGET_FUNCTION} actualizado.`);
console.log(`source.html: ${html.length} bytes -> base64: ${b64.length} chars`);
console.log('Round-trip verificado: decode(base64) === source.html byte a byte.');
