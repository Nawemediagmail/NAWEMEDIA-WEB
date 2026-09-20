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

// Evalúa el "aging" de recrawl de una URL: si sigue pendiente (misma
// condición que un warn de GSC), cuántos días pasaron desde
// canonicalFixedAt, el umbral aplicable (recrawlEscalationDays por URL,
// 30 por defecto) y cuántos días faltan para escalar (0 si ya escaló).
// Devuelve null si la URL no aplica (sin expectedCanonical o sin
// canonicalFixedAt declarados). "now" es inyectable para tests
// deterministas; siempre en UTC porque canonicalFixedAt y lastCrawlTime
// ya vienen en ISO 8601 UTC.
export function evaluateRecrawlAging(entry, indexStatusResult, { now = new Date() } = {}) {
  if (!entry.expectedCanonical || !entry.canonicalFixedAt) return null;

  const daysSinceFixed = daysElapsed(entry.canonicalFixedAt, now);
  if (daysSinceFixed === null) return null;

  const thresholdDays = entry.recrawlEscalationDays ?? DEFAULT_THRESHOLD_DAYS;
  const pending = isPending(entry, indexStatusResult);
  const escalated = pending && daysSinceFixed >= thresholdDays;

  return {
    id: entry.id,
    label: entry.label,
    path: entry.path,
    pending,
    escalated,
    daysSinceFixed,
    thresholdDays,
    daysRemaining: pending ? Math.max(thresholdDays - daysSinceFixed, 0) : null,
  };
}

// Detecta URLs cuyo canonical se corrigió (canonicalFixedAt) hace más de
// su umbral y que Search Console todavía no confirma: las que evaluateRecrawlAging
// marca como escaladas.
export function findEscalations(urls, resultsById, { now = new Date(), siteUrl } = {}) {
  const escalations = [];
  for (const entry of urls) {
    const indexStatusResult = resultsById.get(entry.id) ?? null;
    const aging = evaluateRecrawlAging(entry, indexStatusResult, { now });
    if (!aging || !aging.escalated) continue;

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
      daysSinceFixed: aging.daysSinceFixed,
      thresholdDays: aging.thresholdDays,
    });
  }
  return escalations;
}

// Tabla de aging para el Step Summary: una fila por cada URL con
// canonicalFixedAt declarado (las que no aplican quedan afuera), resuelta
// o no.
export function computeRecrawlAgingTable(urls, resultsById, { now = new Date() } = {}) {
  const rows = [];
  for (const entry of urls) {
    const indexStatusResult = resultsById.get(entry.id) ?? null;
    const aging = evaluateRecrawlAging(entry, indexStatusResult, { now });
    if (aging) rows.push(aging);
  }
  return rows;
}
