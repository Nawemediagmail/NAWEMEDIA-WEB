import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const CANONICAL_RE = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i;
const ROBOTS_META_RE = /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i;

// Carpetas dentro de sitio/ que no son páginas HTML públicas (funciones
// serverless, assets, etc.) y no se escanean.
const EXCLUDED_DIRS = new Set(['api']);

export function findHtmlEntryPoints(sitioDir) {
  const results = [];
  walk(sitioDir, sitioDir, results);
  return results;
}

function walk(root, dir, results) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(root, join(dir, entry.name), results);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

    const fullPath = join(dir, entry.name);
    const rel = relative(root, fullPath).split(sep).join('/');
    const routePath = entry.name === 'index.html'
      ? '/' + rel.slice(0, -'index.html'.length)
      : '/' + rel;

    results.push({ file: fullPath, routePath });
  }
}

export function classifyEntryPoint({ file, routePath }) {
  const html = readFileSync(file, 'utf-8');
  const canonicalMatch = html.match(CANONICAL_RE);
  const robotsMatch = html.match(ROBOTS_META_RE);
  const robotsContent = robotsMatch ? robotsMatch[1] : null;
  const noindex = robotsContent ? /noindex/i.test(robotsContent) : false;
  return { routePath, canonical: canonicalMatch ? canonicalMatch[1] : null, noindex };
}

// Cualquier página HTML del repo que sea indexable (sin noindex) y no esté
// declarada en monitored-urls.json es una "URL olvidada": el patrón exacto
// que causó el aviso original de GSC (página nueva, sin canonical, sin
// que nadie la esté vigilando). Las páginas con noindex explícito se
// consideran intencionalmente privadas y no requieren declaración.
export function findForgottenUrls(sitioDir, declaredPaths) {
  const declared = new Set(declaredPaths);
  const entries = findHtmlEntryPoints(sitioDir);
  const forgotten = [];
  for (const entry of entries) {
    const info = classifyEntryPoint(entry);
    if (info.noindex) continue;
    if (declared.has(info.routePath)) continue;
    forgotten.push(info.routePath);
  }
  return forgotten.sort();
}
