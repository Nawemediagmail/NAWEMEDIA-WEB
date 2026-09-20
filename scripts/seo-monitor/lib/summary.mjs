function renderRecrawlAgingTable(recrawlAging) {
  if (!recrawlAging || recrawlAging.length === 0) return [];

  const lines = [
    '## Recrawl aging',
    '',
    '| URL | Días transcurridos | Umbral | Días restantes | Estado |',
    '|---|---|---|---|---|',
  ];
  for (const row of recrawlAging) {
    const estado = row.escalated ? '🔴 escalado' : row.pending ? '🟡 pendiente' : '🟢 resuelto';
    const restantes = row.daysRemaining === null ? '—' : String(row.daysRemaining);
    lines.push(`| ${row.label} (\`${row.path}\`) | ${row.daysSinceFixed} | ${row.thresholdDays} | ${restantes} | ${estado} |`);
  }
  lines.push('');
  return lines;
}

function severityCounts(findings) {
  return {
    fails: findings.filter((f) => f.severity === 'fail'),
    warns: findings.filter((f) => f.severity === 'warn'),
    oks: findings.filter((f) => f.severity === 'ok'),
  };
}

// Cuerpo compartido entre el summary de un solo sitio (renderStepSummary)
// y el multi-sitio (renderMultiSiteSummary): fallos, advertencias, tabla
// de recrawl aging y el detalle de checks OK. Sin encabezado ni línea de
// conteo — eso lo arma cada llamador a su propio nivel (H1 vs H2 por
// sitio).
function renderFindingsBody(findings, { recrawlAging } = {}) {
  const { fails, warns, oks } = severityCounts(findings);
  const lines = [];

  if (fails.length) {
    lines.push('## Fallos', '');
    for (const f of fails) lines.push(`- **[${f.check}]** ${f.message}`);
    lines.push('');
  }

  if (warns.length) {
    lines.push('## Advertencias (recrawl pendiente / informativo)', '');
    for (const f of warns) lines.push(`- **[${f.check}]** ${f.message}`);
    lines.push('');
  }

  lines.push(...renderRecrawlAgingTable(recrawlAging));

  lines.push('<details><summary>Checks OK</summary>', '');
  for (const f of oks) lines.push(`- [${f.check}] ${f.message}`);
  lines.push('', '</details>');

  return lines;
}

export function renderStepSummary({ findings, runUrl, recrawlAging }) {
  const { fails, warns, oks } = severityCounts(findings);

  const lines = [
    '# SEO monitor — resultado',
    '',
    `${fails.length ? '🔴' : warns.length ? '🟡' : '🟢'} **${fails.length} fail · ${warns.length} warn · ${oks.length} ok**`,
    runUrl ? `\nCorrida: ${runUrl}` : '',
    '',
    ...renderFindingsBody(findings, { recrawlAging }),
  ];

  return lines.join('\n');
}

// Agrupa el resultado de varios sitios en un único Step Summary: una tabla
// de resumen (fail/warn/ok por sitio) y después una sección H2 por sitio
// con su propio detalle — cada sitio usa su propio array de findings, así
// que un fail de un sitio nunca contamina el conteo ni el detalle de otro.
export function renderMultiSiteSummary(siteResults, { runUrl } = {}) {
  const totals = { fail: 0, warn: 0, ok: 0 };
  const overviewRows = [];

  for (const { site, findings } of siteResults) {
    const { fails, warns, oks } = severityCounts(findings);
    totals.fail += fails.length;
    totals.warn += warns.length;
    totals.ok += oks.length;
    overviewRows.push(`| ${site.label} | \`${site.profile}\` | ${fails.length} | ${warns.length} | ${oks.length} |`);
  }

  const lines = [
    '# SEO monitor — resultado (multi-sitio)',
    '',
    `${totals.fail ? '🔴' : totals.warn ? '🟡' : '🟢'} **${totals.fail} fail · ${totals.warn} warn · ${totals.ok} ok** en total`,
    runUrl ? `\nCorrida: ${runUrl}` : '',
    '',
    '| Sitio | Perfil | Fail | Warn | Ok |',
    '|---|---|---|---|---|',
    ...overviewRows,
    '',
  ];

  for (const { site, findings, recrawlAging } of siteResults) {
    const { fails, warns, oks } = severityCounts(findings);
    const emoji = fails.length ? '🔴' : warns.length ? '🟡' : '🟢';
    lines.push(
      `## ${emoji} ${site.label} (\`${site.baseUrl}\`, perfil \`${site.profile}\`)`,
      '',
      `${fails.length} fail · ${warns.length} warn · ${oks.length} ok`,
      '',
      ...renderFindingsBody(findings, { recrawlAging }),
      '',
    );
  }

  return lines.join('\n');
}
