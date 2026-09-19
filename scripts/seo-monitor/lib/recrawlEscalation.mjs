const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_THRESHOLD_DAYS = 30;

function normalizeAccents(str) {
  return typeof str === 'string' ? str.normalize('NFD').replace(/[̀-ͯ]/g, '') : '';
}

function isCoverageDuplicate(coverageState) {
  const n = normalizeAccents(coverageState);
  return /duplicad/i.test(n) && /canonic/i.test(n);
}

function daysElapsed(isoDate, now) {
  const from = new Date(isoDate);
  if (Number.isNaN(from.getTime())) return null;
  return Math.floor((now.getTime() - from.getTime()) / MS_PER_DAY);
}

// Misma condición que dispara un warn de GSC en evaluateGscResult
// (lib/gsc.mjs): sin lastCrawlTime, coverageState "duplicada" o
// googleCanonical distinto al esperado. Acá solo se reutiliza para decidir
// si, además, ya pasó el umbral de días como para escalar a un issue.
function isPending(entry, indexStatusResult) {
  if (!indexStatusResult) return true;
  const { coverageState, googleCanonical, lastCrawlTime } = indexStatusResult;
  if (!lastCrawlTime) return true;
  if (isCoverageDuplicate(coverageState)) return true;
  if (googleCanonical !== entry.expectedCanonical) return true;
  return false;
}

// Detecta URLs cuyo canonical se corrigió (canonicalFixedAt) hace más de
// recrawlEscalationDays (30 por defecto, configurable por URL) y que
// Search Console todavía no confirma. Solo aplica a URLs con
// expectedCanonical + canonicalFixedAt declarados. "now" es inyectable
// para que los tests sean deterministas; siempre se compara en UTC porque
// canonicalFixedAt y lastCrawlTime ya vienen en ISO 8601 UTC.
export function findEscalations(urls, resultsById, { now = new Date(), siteUrl } = {}) {
  const escalations = [];
  for (const entry of urls) {
    if (!entry.expectedCanonical || !entry.canonicalFixedAt) continue;

    const indexStatusResult = resultsById.get(entry.id) ?? null;
    if (!isPending(entry, indexStatusResult)) continue;

    const daysSinceFixed = daysElapsed(entry.canonicalFixedAt, now);
    if (daysSinceFixed === null) continue;

    const thresholdDays = entry.recrawlEscalationDays ?? DEFAULT_THRESHOLD_DAYS;
    if (daysSinceFixed < thresholdDays) continue;

    escalations.push({
      id: entry.id,
      label: entry.label,
      path: entry.path,
      url: siteUrl ? new URL(entry.path, siteUrl).toString() : entry.path,
      expectedCanonical: entry.expectedCanonical,
      googleCanonical: indexStatusResult?.googleCanonical ?? null,
      coverageState: indexStatusResult?.coverageState ?? null,
      lastCrawlTime: indexStatusResult?.lastCrawlTime ?? null,
      canonicalFixedAt: entry.canonicalFixedAt,
      daysSinceFixed,
      thresholdDays,
    });
  }
  return escalations;
}
