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

// Evalúa el resultado de indexStatusResult contra lo declarado para esa
// entrada. Un canonical incorrecto (o el string literal de "duplicada, sin
// canonical" que reportaba GSC) es 'fail'. La ausencia de señal porque
// Google todavía no recrawleó la URL es 'warn', no 'fail'.
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

  if (!lastCrawlTime) {
    findings.push({
      id: entry.id, check: 'gsc', severity: 'warn',
      message: `${entry.label}: todavía sin lastCrawlTime (recrawl pendiente)`,
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
      id: entry.id, check: 'gsc-coverage', severity: 'fail',
      message: `${entry.label}: GSC todavía marca coverageState="${coverageState}"`,
    });
  }

  if (entry.expectedCanonical) {
    if (googleCanonical && googleCanonical !== entry.expectedCanonical) {
      findings.push({
        id: entry.id, check: 'gsc-canonical', severity: 'fail',
        message: `${entry.label}: googleCanonical="${googleCanonical}", esperado "${entry.expectedCanonical}"`,
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
        id: entry.id, check: 'gsc-user-canonical', severity: 'fail',
        message: `${entry.label}: userCanonical="${userCanonical}" no coincide con el declarado en el HTML`,
      });
    }
  }

  findings.push({
    id: entry.id, check: 'gsc-info', severity: 'ok',
    message: `${entry.label}: coverageState="${coverageState ?? '(?)'}" indexingState="${indexingState ?? '(?)'}" lastCrawlTime="${lastCrawlTime ?? '(nunca)'}"`,
  });

  return findings;
}
