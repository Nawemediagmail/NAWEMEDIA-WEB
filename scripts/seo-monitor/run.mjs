#!/usr/bin/env node
// Monitor SEO/disponibilidad multi-sitio. Cada sitio se declara en
// scripts/seo-monitor/sites/*.json con un "profile": public-seo (HTTP,
// canonical, robots/sitemap, Search Console, recrawl aging) o private-app
// (disponibilidad, redirect de autenticación, noindex, headers de
// seguridad — sin GSC ni sitemap). Corre vía
// .github/workflows/seo-monitor.yml (cron lunes 12:00 UTC +
// workflow_dispatch). No usa credenciales propias: la identidad hacia
// Google Search Console llega por OIDC (google-github-actions/auth), y
// hacia GitHub por el GITHUB_TOKEN default del workflow.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkUrlEntry } from './lib/checkUrl.mjs';
import { checkRobotsAndSitemap } from './lib/robotsSitemap.mjs';
import { inspectUrl, evaluateGscResult } from './lib/gsc.mjs';
import { findForgottenUrls } from './lib/coverage.mjs';
import { syncIssue } from './lib/issue.mjs';
import { findEscalations, computeRecrawlAgingTable } from './lib/recrawlEscalation.mjs';
import { syncRecrawlEscalationIssue } from './lib/recrawlEscalationIssue.mjs';
import { renderMultiSiteSummary } from './lib/summary.mjs';
import { loadSites } from './lib/sitesConfig.mjs';
import { regressionMarker, regressionTitle, escalationMarker, escalationTitle } from './lib/siteIssueMarkers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sitesDir = join(__dirname, 'sites');
const repoRoot = join(__dirname, '..', '..');

function runUrl() {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
  }
  return '(corrida local)';
}

// Corre todos los checks de un sitio y devuelve sus findings, aislados de
// cualquier otro sitio (arrays/Map propios, nunca compartidos).
async function checkSite(site, accessToken) {
  const findings = [];

  for (const entry of site.urls) {
    findings.push(...await checkUrlEntry(entry, site.baseUrl));
  }

  findings.push(...await checkRobotsAndSitemap(site, site.baseUrl));

  const gscResultsById = new Map();
  if (site.profile === 'public-seo') {
    if (!accessToken) {
      findings.push({
        id: 'gsc', check: 'gsc', severity: 'warn',
        message: 'GSC_ACCESS_TOKEN no configurado: se omitieron las validaciones de Search Console.',
      });
    } else {
      for (const entry of site.urls) {
        if (entry.gsc === false) continue;
        const inspectionUrl = new URL(entry.path, site.baseUrl).toString();
        try {
          const result = await inspectUrl({ accessToken, siteUrl: site.gscSiteUrl, inspectionUrl });
          gscResultsById.set(entry.id, result);
          findings.push(...evaluateGscResult(entry, result));
        } catch (err) {
          // GSC nunca falla el monitor (ver README, sección Severidad): un
          // error consultando la URL Inspection API —incluido un 403 de
          // acceso todavía no configurado para este sitio, ver preflight—
          // es warn, no fail. Solo el chequeo del HTML/HTTP en vivo detecta
          // una regresión real nuestra.
          findings.push({
            id: entry.id, check: 'gsc', severity: 'warn',
            message: `${entry.label}: error consultando Search Console: ${err.message}`,
          });
        }
      }
    }
  }

  // Cobertura de URLs (páginas HTML indexables sin declarar): solo tiene
  // sentido para el sitio cuyo código vive en este repo. localCoverageDir
  // es opcional a propósito — los sitios sin carpeta local (miculka,
  // ops) simplemente no lo declaran y este paso se omite para ellos.
  if (site.localCoverageDir) {
    const sitioDir = join(repoRoot, site.localCoverageDir);
    const forgotten = findForgottenUrls(sitioDir, site.urls.map((u) => u.path));
    for (const p of forgotten) {
      findings.push({
        id: 'coverage', check: 'coverage', severity: 'fail',
        message: `Página indexable en el repo (sin noindex) pero no declarada en scripts/seo-monitor/sites/${site.id}.json: ${p}`,
      });
    }
  }

  const recrawlAging = site.profile === 'public-seo' && accessToken
    ? computeRecrawlAgingTable(site.urls, gscResultsById)
    : [];

  return { site, findings, gscResultsById, recrawlAging };
}

async function main() {
  const sites = loadSites(sitesDir);
  const accessToken = process.env.GSC_ACCESS_TOKEN;

  const siteResults = [];
  for (const site of sites) {
    siteResults.push(await checkSite(site, accessToken));
  }

  const url = runUrl();
  const summary = renderMultiSiteSummary(siteResults, { runUrl: url });
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }

  let totalFails = 0;
  const canSyncIssues = Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY);

  for (const { site, findings, gscResultsById } of siteResults) {
    const fails = findings.filter((f) => f.severity === 'fail');
    totalFails += fails.length;

    if (!canSyncIssues) continue;

    const result = await syncIssue({
      repo: process.env.GITHUB_REPOSITORY,
      token: process.env.GITHUB_TOKEN,
      failFindings: fails,
      runUrl: url,
      marker: regressionMarker(site.id),
      title: regressionTitle(site),
    });
    console.log(`[${site.id}] Issue sync:`, result);

    if (site.profile === 'public-seo' && accessToken) {
      const escalations = findEscalations(site.urls, gscResultsById, { siteUrl: site.baseUrl });
      const escalationResult = await syncRecrawlEscalationIssue({
        repo: process.env.GITHUB_REPOSITORY,
        token: process.env.GITHUB_TOKEN,
        escalations,
        runUrl: url,
        marker: escalationMarker(site.id),
        title: escalationTitle(site),
      });
      console.log(`[${site.id}] Recrawl escalation issue sync:`, escalationResult);
    }
  }

  if (!canSyncIssues) {
    console.log('GITHUB_TOKEN / GITHUB_REPOSITORY no configurados: se omitió la sincronización de issues.');
  }

  if (totalFails > 0) {
    console.error(`${totalFails} hallazgo(s) en fail en total.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
