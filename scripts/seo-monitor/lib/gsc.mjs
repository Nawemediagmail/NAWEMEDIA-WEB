const INSPECT_ENDPOINT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

// Consulta la URL Inspection API de Search Console. Requiere un access
// token OAuth2 (obtenido vía google-github-actions/auth con Workload
// Identity Federation, scope webmasters.readonly) — nunca una service
// account JSON ni un secret guardado en el repo.
export async function inspectUrl({ accessToken, siteUrl, inspectionUrl, fetchImpl = fetch }) {
  const res = await fetchImpl(INSPECT_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: 'es' }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Search Console API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data?.inspectionResult?.indexStatusResult ?? null;
}

// Compara el lastCrawlTime de GSC contra canonicalFixedAt (cuándo se
// corrigió el canonical de esa URL en el repo, declarado en
// monitored-urls.json). Google recrawlea con retraso de días a semanas,
// así que un coverageState/canonical "viejo" en GSC no es una regresión
// nuestra: es una fotografía de antes del fix. Devuelve una anotación
// para el mensaje, o '' si no hay canonicalFixedAt configurado para
// comparar (no se puede distinguir, se trata como recrawl pendiente genérico).
function describeCrawlFreshness(entry, lastCrawlTime) {
  if (!entry.canonicalFixedAt || !lastCrawlTime) return '';
  const crawled = new Date(lastCrawlTime);
  const fixed = new Date(entry.canonicalFixedAt);
  if (Number.isNaN(crawled.getTime()) || Number.isNaN(fixed.getTime())) return '';

  if (crawled < fixed) {
    return ` — dato de GSC del ${lastCrawlTime}, anterior a la corrección del canonical (${entry.canonicalFixedAt}): recrawl pendiente, no es una regresión`;
  }
  return ` — GSC ya recrawleó el ${lastCrawlTime} (después de la corrección del ${entry.canonicalFixedAt}) y todavía no coincide: puede tardar más ciclos de indexación; si persiste en corridas futuras, revisar manualmente`;
}

// Evalúa el resultado de indexStatusResult contra lo declarado para esa
// entrada. Los hallazgos de Search Console NUNCA son 'fail': GSC recrawlea
// con retraso propio, fuera de nuestro control y desacoplado del momento
// del deploy, así que cualquier discrepancia (coverageState "duplicada",
// canonical distinto, o URL que Google todavía no reconoce) es 'warn' por
// recrawl pendiente. Lo que sí puede fallar el monitor es el chequeo del
// HTML/HTTP en vivo (ver checkUrl.mjs) — ese es el que detecta una
// regresión real nuestra.
export function evaluateGscResult(entry, indexStatusResult) {
  const findings = [];

  if (!indexStatusResult) {
    findings.push({
      id: entry.id, check: 'gsc', severity: 'warn',
      message: `${entry.label}: Search Console no devolvió indexStatusResult (posible recrawl pendiente)`,
    });
    return findings;
  }

  const { coverageState, indexingState, userCanonical, googleCanonical, lastCrawlTime } = indexStatusResult;
  const freshness = describeCrawlFreshness(entry, lastCrawlTime);

  if (!lastCrawlTime) {
    findings.push({
      id: entry.id, check: 'gsc', severity: 'warn',
      message: `${entry.label}: todavía sin lastCrawlTime (recrawl pendiente, Google no reconoce esta URL todavía)`,
    });
  }

  // GSC devuelve este texto en inglés o español según el idioma de la
  // cuenta ("canonical" vs "canónica/canónico"): se comparan sin acentos
  // para no depender de cuál esté activo.
  const normalizedCoverage = typeof coverageState === 'string'
    ? coverageState.normalize('NFD').replace(/[̀-ͯ]/g, '')
    : '';
  if (/duplicad/i.test(normalizedCoverage) && /canonic/i.test(normalizedCoverage)) {
    findings.push({
      id: entry.id, check: 'gsc-coverage', severity: 'warn',
      message: `${entry.label}: GSC todavía marca coverageState="${coverageState}"${freshness || ' — recrawl pendiente'}`,
    });
  }

  if (entry.expectedCanonical) {
    if (googleCanonical && googleCanonical !== entry.expectedCanonical) {
      findings.push({
        id: entry.id, check: 'gsc-canonical', severity: 'warn',
        message: `${entry.label}: googleCanonical="${googleCanonical}", esperado "${entry.expectedCanonical}"${freshness || ' — recrawl pendiente'}`,
      });
    } else if (!googleCanonical) {
      findings.push({
        id: entry.id, check: 'gsc-canonical', severity: 'warn',
        message: `${entry.label}: googleCanonical todavía no asignado (recrawl pendiente)`,
      });
    } else {
      findings.push({
        id: entry.id, check: 'gsc-canonical', severity: 'ok',
        message: `${entry.label}: googleCanonical coincide con lo esperado`,
      });
    }

    if (userCanonical && userCanonical !== entry.expectedCanonical) {
      findings.push({
        id: entry.id, check: 'gsc-user-canonical', severity: 'warn',
        message: `${entry.label}: userCanonical="${userCanonical}" no coincide con el declarado en el HTML${freshness || ' — recrawl pendiente'}`,
      });
    }
  }

  findings.push({
    id: entry.id, check: 'gsc-info', severity: 'ok',
    message: `${entry.label}: coverageState="${coverageState ?? '(?)'}" indexingState="${indexingState ?? '(?)'}" lastCrawlTime="${lastCrawlTime ?? '(nunca)'}"`,
  });

  return findings;
}
