const MARKER = '<!-- seo-monitor:managed-issue -->';
const LABEL = 'seo-monitor';
const TITLE = 'SEO monitor: regresión detectada en URLs corregidas';

async function ghFetch(path, { token, method = 'GET', body, fetchImpl = fetch }) {
  const res = await fetchImpl(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'nawemedia-seo-monitor',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}

async function findManagedIssueByMarker({ repo, token, label, marker, fetchImpl }) {
  const issues = await ghFetch(`/repos/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=20`, { token, fetchImpl });
  return issues.find((i) => typeof i.body === 'string' && i.body.includes(marker)) ?? null;
}

export async function findManagedIssue({ repo, token, fetchImpl }) {
  return findManagedIssueByMarker({ repo, token, label: LABEL, marker: MARKER, fetchImpl });
}

export function renderIssueBody(failFindings, runUrl, marker = MARKER) {
  return [
    marker,
    '# Regresión SEO detectada',
    '',
    `Corrida: ${runUrl}`,
    '',
    ...failFindings.map((f) => `- **[${f.check}]** ${f.message}`),
    '',
    '_Este issue se cierra automáticamente en la próxima corrida del monitor si no quedan hallazgos en fail._',
  ].join('\n');
}

// Ciclo de vida genérico de un único issue "vivo" identificado por
// marker+label: se crea la primera vez que shouldExist es true, se
// actualiza mientras lo siga siendo, y se cierra solo (con comentario) en
// la primera corrida en que deja de serlo. Nunca se abren issues
// duplicados para el mismo marker. Reutilizado por syncIssue (regresiones
// en fail) y por syncRecrawlEscalationIssue (recrawl pendiente > umbral).
export async function syncManagedIssue({ repo, token, label, marker, title, shouldExist, body, closeComment, fetchImpl }) {
  const existing = await findManagedIssueByMarker({ repo, token, label, marker, fetchImpl });

  if (!shouldExist) {
    if (!existing) return { action: 'none' };
    await ghFetch(`/repos/${repo}/issues/${existing.number}`, {
      token, fetchImpl, method: 'PATCH', body: { state: 'closed', state_reason: 'completed' },
    });
    await ghFetch(`/repos/${repo}/issues/${existing.number}/comments`, {
      token, fetchImpl, method: 'POST', body: { body: closeComment },
    });
    return { action: 'closed', number: existing.number };
  }

  if (existing) {
    await ghFetch(`/repos/${repo}/issues/${existing.number}`, { token, fetchImpl, method: 'PATCH', body: { body } });
    return { action: 'updated', number: existing.number };
  }

  const created = await ghFetch(`/repos/${repo}/issues`, {
    token, fetchImpl, method: 'POST', body: { title, body, labels: [label] },
  });
  return { action: 'created', number: created.number };
}

// marker/title son parametrizables para que cada sitio del motor
// multi-sitio tenga su propio issue de regresión, separado y deduplicado
// (ver lib/siteIssueMarkers.mjs). Sin overrides, el comportamiento es
// exactamente el original (issue #40 de nawemedia.com).
export async function syncIssue({ repo, token, failFindings, runUrl, fetchImpl, marker = MARKER, title = TITLE }) {
  return syncManagedIssue({
    repo, token, fetchImpl,
    label: LABEL,
    marker,
    title,
    shouldExist: failFindings.length > 0,
    body: renderIssueBody(failFindings, runUrl, marker),
    closeComment: `Resuelto: la corrida ${runUrl} no encontró hallazgos en fail. Cerrando automáticamente.`,
  });
}
