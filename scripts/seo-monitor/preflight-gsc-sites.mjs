#!/usr/bin/env node
// Preflight de solo lectura para diagnosticar el 403 "You do not own this
// site, or the inspected URL is not part of this property" de la URL
// Inspection API: lista con sites.list qué propiedades de Search Console
// ve realmente la identidad autenticada y con qué permissionLevel, y lo
// compara contra gscSiteUrl en monitored-urls.json.
//
// Puramente diagnóstico: no usa tokens ni scopes nuevos (reusa
// GSC_ACCESS_TOKEN y el scope webmasters.readonly ya pedidos por el
// monitor), no toca localStorage/GitHub/issue, y nunca hace fallar el job
// — un error acá se muestra en el Step Summary, no interrumpe el resto
// del workflow.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listSites, renderSitesSummary } from './lib/gscSites.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'monitored-urls.json'), 'utf-8'));

async function main() {
  const accessToken = process.env.GSC_ACCESS_TOKEN;
  let summary;

  if (!accessToken) {
    summary = renderSitesSummary([], { error: 'GSC_ACCESS_TOKEN no configurado.' });
  } else {
    try {
      const sites = await listSites({ accessToken });
      summary = renderSitesSummary(sites, { gscSiteUrl: config.gscSiteUrl });
    } catch (err) {
      summary = renderSitesSummary([], { error: err.message });
    }
  }

  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }
}

main();
