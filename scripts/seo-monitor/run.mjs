#!/usr/bin/env node
// Monitor SEO semanal para las URLs de producción corregidas en la
// auditoría de canonicals (docs/seo/NAWEMEDIA_SEO_CANONICAL_AUDIT_2026.md).
// Corre vía .github/workflows/seo-monitor.yml (cron lunes 12:00 UTC +
// workflow_dispatch). No usa credenciales propias: la identidad hacia
// Google Search Console llega por OIDC (google-github-actions/auth), y
// hacia GitHub por el GITHUB_TOKEN default del workflow.
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkUrlEntry } from './lib/checkUrl.mjs';
import { checkRobotsAndSitemap } from './lib/robotsSitemap.mjs';
import { inspectUrl, evaluateGscResult } from './lib/gsc.mjs';
import { findForgottenUrls } from './lib/coverage.mjs';
import { syncIssue } from './lib/issue.mjs';
import { renderStepSummary } from './lib/summary.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'monitored-urls.json'), 'utf-8'));
const sitioDir = join(__dirname, '..', '..', 'sitio');

function runUrl() {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
  }
  return '(corrida local)';
}

async function main() {
  const findings = [];

  for (const entry of config.urls) {
    findings.push(...await checkUrlEntry(entry, config.siteUrl));
  }

  findings.push(...await checkRobotsAndSitemap(config, config.siteUrl));

  const accessToken = process.env.GSC_ACCESS_TOKEN;
  if (!accessToken) {
    findings.push({
      id: 'gsc', check: 'gsc', severity: 'warn',
      message: 'GSC_ACCESS_TOKEN no configurado: se omitieron las validaciones de Search Console.',
    });
  } else {
    for (const entry of config.urls) {
      if (entry.gsc === false) continue;
      const inspectionUrl = new URL(entry.path, config.siteUrl).toString();
      try {
        const result = await inspectUrl({ accessToken, siteUrl: config.gscSiteUrl, inspectionUrl });
        findings.push(...evaluateGscResult(entry, result));
      } catch (err) {
        findings.push({
          id: entry.id, check: 'gsc', severity: 'fail',
          message: `${entry.label}: error consultando Search Console: ${err.message}`,
        });
      }
    }
  }

  const forgotten = findForgottenUrls(sitioDir, config.urls.map((u) => u.path));
  for (const p of forgotten) {
    findings.push({
      id: 'coverage', check: 'coverage', severity: 'fail',
      message: `Página indexable en el repo (sin noindex) pero no declarada en scripts/seo-monitor/monitored-urls.json: ${p}`,
    });
  }

  const url = runUrl();
  const summary = renderStepSummary({ findings, runUrl: url });
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }

  const fails = findings.filter((f) => f.severity === 'fail');

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    const result = await syncIssue({
      repo: process.env.GITHUB_REPOSITORY,
      token: process.env.GITHUB_TOKEN,
      failFindings: fails,
      runUrl: url,
    });
    console.log('Issue sync:', result);
  } else {
    console.log('GITHUB_TOKEN / GITHUB_REPOSITORY no configurados: se omitió la sincronización del issue.');
  }

  if (fails.length > 0) {
    console.error(`${fails.length} hallazgo(s) en fail.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
