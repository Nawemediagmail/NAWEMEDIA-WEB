import { syncManagedIssue } from './issue.mjs';

const MARKER = '<!-- seo-monitor:recrawl-escalation-issue -->';
const LABEL = 'seo-monitor';
const TITLE = 'seo-monitor: recrawl pendiente por más de 30 días';

export function renderEscalationBody(escalations, runUrl) {
  const sections = escalations.map((e) => [
    `## ${e.label} (${e.path})`,
    '',
    `- URL: ${e.url}`,
    `- Canonical esperado: ${e.expectedCanonical}`,
    `- Canonical de Google: ${e.googleCanonical ?? '(sin asignar)'}`,
    `- coverageState: ${e.coverageState ?? '(?)'}`,
    `- lastCrawlTime: ${e.lastCrawlTime ?? '(nunca)'}`,
    `- canonicalFixedAt: ${e.canonicalFixedAt}`,
    `- Días transcurridos: ${e.daysSinceFixed} (umbral: ${e.thresholdDays})`,
  ].join('\n'));

  return [
    MARKER,
    '# Recrawl pendiente por más de 30 días',
    '',
    `Corrida: ${runUrl}`,
    '',
    ...sections,
    '',
    '_Este issue se cierra automáticamente en la próxima corrida del monitor si ninguna URL supera el umbral de recrawl configurado._',
  ].join('\n');
}

// Igual que syncIssue (lib/issue.mjs) pero para un issue separado que
// escala warnings de GSC que llevan demasiado tiempo pendientes de
// recrawl. Nunca se dispara desde un fail: el warn de GSC sigue siendo
// warn siempre, esto es una alarma adicional de "revisar a mano" cuando
// el recrawl pendiente se estanca.
export async function syncRecrawlEscalationIssue({ repo, token, escalations, runUrl, fetchImpl }) {
  return syncManagedIssue({
    repo, token, fetchImpl,
    label: LABEL,
    marker: MARKER,
    title: TITLE,
    shouldExist: escalations.length > 0,
    body: escalations.length > 0 ? renderEscalationBody(escalations, runUrl) : '',
    closeComment: `Resuelto: la corrida ${runUrl} no encontró URLs con recrawl pendiente por más del umbral configurado. Cerrando automáticamente.`,
  });
}
