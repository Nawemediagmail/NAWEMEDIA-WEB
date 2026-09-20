import { fetchChain } from './http.mjs';

const CANONICAL_RE = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i;
const ROBOTS_META_RE = /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i;

export function extractCanonical(html) {
  const m = html.match(CANONICAL_RE);
  return m ? m[1] : null;
}

export function extractRobotsMeta(html) {
  const m = html.match(ROBOTS_META_RE);
  return m ? m[1] : null;
}

function statusMatches(actual, expected) {
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
}

// Evalúa una entrada declarada en monitored-urls.json contra la producción
// real. Devuelve una lista de findings { id, check, severity, message }.
// severity: 'fail' (regresión real) | 'warn' (informativo) | 'ok'.
export async function checkUrlEntry(entry, siteUrl, { fetchImpl = fetch } = {}) {
  const findings = [];
  const target = new URL(entry.path, siteUrl).toString();

  let result;
  try {
    result = await fetchChain(target, { fetchImpl });
  } catch (err) {
    findings.push({
      id: entry.id, check: 'http', severity: 'fail',
      message: `${entry.label}: error de red consultando ${target}: ${err.message}`,
    });
    return findings;
  }

  if (!statusMatches(result.finalStatus, entry.expectedFinalStatus)) {
    findings.push({
      id: entry.id, check: 'http', severity: 'fail',
      message: `${entry.label}: status final ${result.finalStatus}, esperado ${JSON.stringify(entry.expectedFinalStatus)} (${target})`,
    });
  } else {
    findings.push({
      id: entry.id, check: 'http', severity: 'ok',
      message: `${entry.label}: status final ${result.finalStatus} OK`,
    });
  }

  if (entry.expectedRedirect) {
    const first = result.chain[0];
    const expectedTo = new URL(entry.expectedRedirect.to, siteUrl).toString();
    if (!first || first.status !== entry.expectedRedirect.status) {
      findings.push({
        id: entry.id, check: 'redirect', severity: 'fail',
        message: `${entry.label}: redirect inicial status ${first?.status ?? '(ninguno)'}, esperado ${entry.expectedRedirect.status}`,
      });
    } else if (!first.location || new URL(first.location, target).toString() !== expectedTo) {
      findings.push({
        id: entry.id, check: 'redirect', severity: 'fail',
        message: `${entry.label}: redirect apunta a "${first.location}", esperado "${expectedTo}"`,
      });
    } else {
      findings.push({
        id: entry.id, check: 'redirect', severity: 'ok',
        message: `${entry.label}: redirect ${entry.expectedRedirect.status} correcto a ${expectedTo}`,
      });
    }
  }

  // Headers de seguridad esperados (perfil private-app, pero disponible para
  // cualquier entrada): se verifican sobre la respuesta final sin importar
  // el status, porque headers como HSTS deben estar presentes incluso en un
  // redirect de autenticación. Valor `true` = solo exigir que el header
  // esté presente; string = valor exacto; array = uno de varios valores
  // aceptables.
  if (entry.expectedHeaders) {
    for (const [name, expected] of Object.entries(entry.expectedHeaders)) {
      const actual = result.finalHeaders.get(name);
      const ok = expected === true ? actual !== null
        : Array.isArray(expected) ? expected.includes(actual)
        : actual === expected;
      if (ok) {
        findings.push({
          id: entry.id, check: 'security-header', severity: 'ok',
          message: `${entry.label}: header "${name}" correcto`,
        });
      } else {
        findings.push({
          id: entry.id, check: 'security-header', severity: 'fail',
          message: `${entry.label}: header "${name}"="${actual ?? '(ausente)'}", esperado ${JSON.stringify(expected)}`,
        });
      }
    }
  }

  if (result.finalStatus === 200) {
    if (entry.canonicalCheck !== false && entry.expectedCanonical) {
      const canonical = extractCanonical(result.finalBody);
      if (canonical !== entry.expectedCanonical) {
        findings.push({
          id: entry.id, check: 'canonical', severity: 'fail',
          message: `${entry.label}: canonical "${canonical ?? '(ausente)'}", esperado "${entry.expectedCanonical}"`,
        });
      } else {
        findings.push({
          id: entry.id, check: 'canonical', severity: 'ok',
          message: `${entry.label}: canonical correcto`,
        });
      }
    }

    const robotsMeta = extractRobotsMeta(result.finalBody);
    if (entry.expectedRobotsMeta) {
      if (robotsMeta !== entry.expectedRobotsMeta) {
        findings.push({
          id: entry.id, check: 'robots-meta', severity: 'fail',
          message: `${entry.label}: meta robots "${robotsMeta ?? '(ausente)'}", esperado "${entry.expectedRobotsMeta}"`,
        });
      } else {
        findings.push({
          id: entry.id, check: 'robots-meta', severity: 'ok',
          message: `${entry.label}: meta robots correcto`,
        });
      }
    } else if (robotsMeta && /noindex/i.test(robotsMeta)) {
      findings.push({
        id: entry.id, check: 'robots-meta', severity: 'fail',
        message: `${entry.label}: apareció noindex inesperado ("${robotsMeta}") en una página que debe ser indexable`,
      });
    }

    if (entry.expectedRobotsHeaderOn200) {
      const header = result.finalHeaders.get('x-robots-tag');
      if (header !== entry.expectedRobotsHeaderOn200) {
        findings.push({
          id: entry.id, check: 'robots-header', severity: 'fail',
          message: `${entry.label}: x-robots-tag "${header ?? '(ausente)'}", esperado "${entry.expectedRobotsHeaderOn200}"`,
        });
      } else {
        findings.push({
          id: entry.id, check: 'robots-header', severity: 'ok',
          message: `${entry.label}: x-robots-tag correcto`,
        });
      }
    }
  }

  return findings;
}
