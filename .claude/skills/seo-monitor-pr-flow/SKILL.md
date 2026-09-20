---
name: seo-monitor-pr-flow
description: Ciclo de cambio, PR, merge y verificación para el monitor SEO (scripts/seo-monitor/**, .github/workflows/seo-monitor*.yml). Usar SIEMPRE que el usuario pida modificar el monitor SEO (nuevas URLs, clasificación de hallazgos, escalamiento, Step Summary), mergear una PR del monitor, ejecutarlo manualmente sobre main y verificar el resultado, o interpretar su Step Summary/issues (label `seo-monitor`). Nació de 4 PRs reales seguidas (#42-#45) con el mismo patrón: rama → cambio acotado → tests → PR draft → esperar aprobación explícita → squash merge → correr manualmente → verificar con el checklist correcto → reportar solo lo pedido.
---

# Ciclo de cambio del monitor SEO

El monitor SEO (`scripts/seo-monitor/`) es zero-dependencia (Node 22 nativo,
`node:test`, sin frameworks), con Search Console vía OIDC (sin secrets) y un
issue "vivo" por tipo de hallazgo (marker HTML + label `seo-monitor`). Cada
cambio real sobre él en esta sesión siguió el mismo ciclo; seguilo en vez de
improvisar uno nuevo.

## Alcance: qué nunca se toca salvo pedido explícito

El usuario de este repo es muy específico con el alcance de cada cambio
("No toques workflow, permisos ni URLs monitoreadas", "No modifiques el
canonical de Savori"). Por defecto, un pedido sobre el monitor NO incluye:

- `lib/checkUrl.mjs` (el chequeo HTTP/HTML en vivo — el único que puede
  fallar el monitor).
- `monitored-urls.json`: agregar/quitar/renombrar **URLs monitoreadas**
  (paths, `expectedCanonical`). Agregar un campo de **configuración** nuevo
  a una URL existente (como `canonicalFixedAt` o `recrawlEscalationDays`)
  sí es razonable cuando el pedido lo pide explícitamente — la distinción
  es "URL monitoreada" vs. "metadato de una URL ya declarada".
- `.github/workflows/seo-monitor*.yml`, permisos, cron.
- El HTML/canonical real del sitio (`sitio/**`) — un hallazgo de GSC
  desactualizado no es licencia para "corregir" una página que el chequeo
  en vivo ya confirma correcta.

Si un pedido no menciona uno de estos, no lo toques aunque parezca una
mejora natural.

## El ciclo, paso a paso

1. **Rama nueva desde `origin/main`** (fetch primero), nunca sobre una rama
   de trabajo anterior — cada feature de esta sesión (#42, #43, #44, #45)
   arrancó de un `origin/main` actualizado.
2. **Implementar exactamente lo pedido**, ni más ni menos (ver alcance
   arriba). Si el mensaje trae un "TIP PRO ⭐️" *en el mismo mensaje* que
   pide un cambio de código, e incluirlo no viola el alcance, implementalo
   como parte de la misma PR (así se hizo con `canonicalFixedAt` y
   `recrawlEscalationDays`). Si el TIP PRO llega en un mensaje que es solo
   de verificación/reporte (sin pedir cambios), o el mensaje dice "No
   hagas más cambios", tratalo como sugerencia para una PR futura —
   mencionalo, no lo implementes ahí.
3. **Validar sin red:**
   ```bash
   node --test scripts/seo-monitor/test/**/*.test.mjs   # el glob es obligatorio:
                                                          # "test/" a secas no resuelve
   node --check <cada archivo tocado>.mjs
   node scripts/seo-monitor/coverage-check.mjs
   ```
4. **PR como draft**, cuerpo con: qué cambia y por qué, qué archivos toca,
   qué NO se tocó (explícito), resultado de tests. **Nunca mergear sin que
   el usuario lo pida explícitamente**, aunque el CI quede verde.
5. **Al pedir merge** ("Mergeá PR #NN con squash"): primero sacar de draft
   (`draft: false`) — un merge sobre una PR todavía en draft devuelve
   `405 Pull Request is still a draft`. Recién después `merge_pull_request`
   con `merge_method: squash` (o el método que pida).
6. **Al pedir correr el monitor manualmente**: `workflow_dispatch` sobre
   `seo-monitor.yml` con `ref: main`.

## La trampa de polling: el estado del run puede mentir por minutos

`actions_get`/`list_workflow_jobs` reportaron `in_progress` durante 4 a 7
minutos más después de que el job ya había terminado de verdad (confirmado
dos veces esta sesión: el run real tardó 45-90s, pero el wrapper siguió
devolviendo `in_progress` mucho después). No te quedes reintentando el
mismo poll de estado creyendo que está colgado.

Señal confiable: `get_job_logs` con el `job_id`. Mientras el job sigue
corriendo de verdad, devuelve **404**. En el momento en que hay contenido,
el job terminó — leé el log directamente (tiene el Step Summary completo
más las líneas `Issue sync:` / `Recrawl escalation issue sync:`) en vez de
esperar a que `actions_get` diga `completed`.

## Checklist de verificación de una corrida

El usuario pide siempre un subconjunto de esto — reportá solo lo que pidió,
pero verificalo todo vos antes de reportar:

- **Resultado**: la línea `N fail · N warn · N ok` del Step Summary (en el
  log de `Correr monitor SEO`, no hace falta adivinar).
- **Issue de regresión** (`label: seo-monitor`, marker
  `<!-- seo-monitor:managed-issue -->`, título "SEO monitor: regresión
  detectada..."): confirmá el estado real con `list_issues` (`state: all`,
  `labels: ["seo-monitor"]`), no te quedes solo con la línea de consola
  `Issue sync: { action: ... }` — es la acción tomada, no el estado final
  visible.
- **Issue de recrawl >30 días** (desde #44; marker
  `<!-- seo-monitor:recrawl-escalation-issue -->`, mismo label): mismo
  chequeo. `action: 'none'` en la consola es esperado y correcto cuando
  ninguna URL superó el umbral — no es un error ni una omisión.
- **Tabla "Recrawl aging"** (desde #45, en el Step Summary): días
  transcurridos = `floor((ahora - canonicalFixedAt) / 24h)` en UTC, **no**
  resta de días de calendario. Si el usuario espera un número basado en
  una cuenta a ojo (ej. "5 días" contando fechas en el calendario) y el
  resultado real da uno menos, no fuerces que coincida — reportá el
  número real y explicá la diferencia (la hora exacta de
  `canonicalFixedAt` importa: antes de esa hora del día siguiente, todavía
  no sumó otro día completo).

## Nunca mergear sin instrucción explícita

Ni un CI verde, ni "queda bien", ni que el usuario haya aprobado la PR
anterior de la serie, autorizan un merge de la siguiente. Cada PR de esta
serie esperó su propio "Mergeá PR #NN" explícito antes de tocar `main`.
