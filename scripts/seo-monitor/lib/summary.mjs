export function renderStepSummary({ findings, runUrl }) {
  const fails = findings.filter((f) => f.severity === 'fail');
  const warns = findings.filter((f) => f.severity === 'warn');
  const oks = findings.filter((f) => f.severity === 'ok');

  const lines = [
    '# SEO monitor — resultado',
    '',
    `${fails.length ? '🔴' : warns.length ? '🟡' : '🟢'} **${fails.length} fail · ${warns.length} warn · ${oks.length} ok**`,
    runUrl ? `\nCorrida: ${runUrl}` : '',
    '',
  ];

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

  lines.push('<details><summary>Checks OK</summary>', '');
  for (const f of oks) lines.push(`- [${f.check}] ${f.message}`);
  lines.push('', '</details>');

  return lines.join('\n');
}
