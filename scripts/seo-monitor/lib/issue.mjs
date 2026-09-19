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

export async function findManagedIssue({ repo, token, fetchImpl }) {
  const issues = await ghFetch(`/repos/${repo}/issues?state=open&labels=${encodeURIComponent(LABEL)}&per_page=20`, { token, fetchImpl });
  return issues.find((i) => typeof i.body === 'string' && i.body.includes(MARKER)) ?? null;
}

export function renderIssueBody(failFindings, runUrl) {
  return [
    MARKER,
    '# Regresión SEO detectada',
    '',
    `Corrida: ${runUrl}`,
    '',
    ...failFindings.map((f) => `- **[${f.check}]** ${f.message}`),
    '',
    '_Este issue se cierra automáticamente en la próxima corrida del monitor si no quedan hallazgos en fail._',
  ].join('\n');
}

// Un único issue "vivo" representa el estado actual: se crea al primer
// fail, se actualiza mientras siga habiendo fails, y se cierra solo
// (con comentario) en la primera corrida limpia. Nunca se abren issues
// duplicados para la misma regresión.
export async function syncIssue({ repo, token, failFindings, runUrl, fetchImpl }) {
  const existing = await findManagedIssue({ repo, token, fetchImpl });

  if (failFindings.length === 0) {
    if (!existing) return { action: 'none' };
    await ghFetch(`/repos/${repo}/issues/${existing.number}`, {
      token, fetchImpl, method: 'PATCH', body: { state: 'closed', state_reason: 'completed' },
    });
    await ghFetch(`/repos/${repo}/issues/${existing.number}/comments`, {
      token, fetchImpl, method: 'POST',
      body: { body: `Resuelto: la corrida ${runUrl} no encontró hallazgos en fail. Cerrando automáticamente.` },
    });
    return { action: 'closed', number: existing.number };
  }

  const body = renderIssueBody(failFindings, runUrl);

  if (existing) {
    await ghFetch(`/repos/${repo}/issues/${existing.number}`, { token, fetchImpl, method: 'PATCH', body: { body } });
    return { action: 'updated', number: existing.number };
  }

  const created = await ghFetch(`/repos/${repo}/issues`, {
    token, fetchImpl, method: 'POST', body: { title: TITLE, body, labels: [LABEL] },
  });
  return { action: 'created', number: created.number };
}
