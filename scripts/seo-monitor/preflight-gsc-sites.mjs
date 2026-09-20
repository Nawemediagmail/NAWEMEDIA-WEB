#!/usr/bin/env node
// Preflight de solo lectura para diagnosticar el 403 "You do not own this
// site, or the inspected URL is not part of this property" de la URL
// Inspection API: lista con sites.list qué propiedades de Search Console
// ve realmente la identidad autenticada y con qué permissionLevel, y lo
// compara contra el gscSiteUrl de cada sitio public-seo declarado en
// scripts/seo-monitor/sites/*.json. Los sitios private-app no tienen
// gscSiteUrl y quedan fuera de esta comparación.
//
// Puramente diagnóstico: no usa tokens ni scopes nuevos (reusa
// GSC_ACCESS_TOKEN y el scope webmasters.readonly ya pedidos por el
// monitor), no toca localStorage/GitHub/issue, y nunca hace fallar el job
// — un error acá se muestra en el Step Summary, no interrumpe el resto
// del workflow.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listSites, renderMultiSiteSummary } from './lib/gscSites.mjs';
import { loadSites } from './lib/sitesConfig.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sitesDir = join(__dirname, 'sites');

async function main() {
  const accessToken = process.env.GSC_ACCESS_TOKEN;
  let summary;

  let configuredSites;
  try {
    configuredSites = loadSites(sitesDir);
  } catch (err) {
    summary = renderMultiSiteSummary([], [], { error: `Configuración de sitios inválida: ${err.message}` });
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
    return;
  }

  if (!accessToken) {
    summary = renderMultiSiteSummary([], configuredSites, { error: 'GSC_ACCESS_TOKEN no configurado.' });
  } else {
    try {
      const sites = await listSites({ accessToken });
      summary = renderMultiSiteSummary(sites, configuredSites, {});
    } catch (err) {
      summary = renderMultiSiteSummary([], configuredSites, { error: err.message });
    }
  }

  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }
}

main();
