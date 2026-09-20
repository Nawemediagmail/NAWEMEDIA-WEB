import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkUrlEntry } from '../lib/checkUrl.mjs';

const SITE = 'https://www.example.com';

function makeFetch(handlers) {
  return async (url) => {
    const key = String(url);
    if (!handlers[key]) throw new Error(`No hay mock de fetch para ${key} (test debe fallar por bug del test, no por red real)`);
    return handlers[key]();
  };
}

function html({ canonical, robots } = {}) {
  const lines = ['<!doctype html>', '<html lang="es">', '<head>', '<meta charset="utf-8">'];
  if (canonical) lines.push(`<link rel="canonical" href="${canonical}">`);
  if (robots) lines.push(`<meta name="robots" content="${robots}">`);
  lines.push('</head><body>x</body></html>');
  return lines.join('\n');
}

test('página con canonical y noindex correctos: sin fails', async () => {
  const entry = {
    id: 'presupuesto', label: 'Presupuesto', path: '/presupuesto/',
    expectedFinalStatus: 200,
    expectedCanonical: `${SITE}/presupuesto/`,
    expectedRobotsMeta: 'noindex, nofollow',
  };
  const fetchImpl = makeFetch({
    [`${SITE}/presupuesto/`]: () => new Response(html({ canonical: `${SITE}/presupuesto/`, robots: 'noindex, nofollow' }), { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
});

test('canonical incorrecto: fail', async () => {
  const entry = {
    id: 'presupuesto', label: 'Presupuesto', path: '/presupuesto/',
    expectedFinalStatus: 200,
    expectedCanonical: `${SITE}/presupuesto/`,
    expectedRobotsMeta: null,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/presupuesto/`]: () => new Response(html({ canonical: `${SITE}/demos/savori-pedidos-hub.html` }), { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.equal(fails[0].check, 'canonical');
});

test('canonical ausente cuando se esperaba uno: fail', async () => {
  const entry = {
    id: 'case-study', label: 'Case study', path: '/case-study/miculka/',
    expectedFinalStatus: 200,
    expectedCanonical: `${SITE}/case-study/miculka/`,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/case-study/miculka/`]: () => new Response(html(), { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.equal(fails[0].check, 'canonical');
});

test('noindex inesperado en página que debe ser indexable: fail', async () => {
  const entry = {
    id: 'demos', label: 'Demo', path: '/demos/x.html',
    expectedFinalStatus: 200,
    expectedCanonical: `${SITE}/demos/x.html`,
    expectedRobotsMeta: null,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/demos/x.html`]: () => new Response(html({ canonical: `${SITE}/demos/x.html`, robots: 'noindex' }), { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.equal(fails[0].check, 'robots-meta');
});

test('electric-side: 401 sin credenciales es el estado esperado, sin fails', async () => {
  const entry = {
    id: 'electric-side', label: 'Electric Side', path: '/electric-side/',
    expectedFinalStatus: [401, 503],
    canonicalCheck: false,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/electric-side/`]: () => new Response('Unauthorized', { status: 401 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
});

test('electric-side: 200 sin credenciales es una regresión crítica de seguridad, fail', async () => {
  const entry = {
    id: 'electric-side', label: 'Electric Side', path: '/electric-side/',
    expectedFinalStatus: [401, 503],
    canonicalCheck: false,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/electric-side/`]: () => new Response('<html>app expuesta</html>', { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.equal(fails[0].check, 'http');
});

test('x-robots-tag ausente en un 200 donde se lo exige: fail', async () => {
  const entry = {
    id: 'electric-side', label: 'Electric Side', path: '/electric-side/',
    expectedFinalStatus: [200, 401, 503],
    canonicalCheck: false,
    expectedRobotsHeaderOn200: 'noindex, nofollow',
  };
  const fetchImpl = makeFetch({
    [`${SITE}/electric-side/`]: () => new Response('<html>app</html>', { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail' && f.check === 'robots-header');
  assert.equal(fails.length, 1);
});

test('redirect permanente correcto: sin fails', async () => {
  const entry = {
    id: 'virginiasoledispa', label: 'Virginia Soledispa', path: '/virginiasoledispa',
    expectedRedirect: { to: '/virginiasoledispa/', status: 308 },
    expectedFinalStatus: 200,
    canonicalCheck: false,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/virginiasoledispa`]: () => new Response(null, { status: 308, headers: { location: `${SITE}/virginiasoledispa/` } }),
    [`${SITE}/virginiasoledispa/`]: () => new Response('<html>epk</html>', { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
});

test('redirect temporal (307) en vez de permanente (308): fail', async () => {
  const entry = {
    id: 'virginiasoledispa', label: 'Virginia Soledispa', path: '/virginiasoledispa',
    expectedRedirect: { to: '/virginiasoledispa/', status: 308 },
    expectedFinalStatus: 200,
    canonicalCheck: false,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/virginiasoledispa`]: () => new Response(null, { status: 307, headers: { location: `${SITE}/virginiasoledispa/` } }),
    [`${SITE}/virginiasoledispa/`]: () => new Response('<html>epk</html>', { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.equal(fails[0].check, 'redirect');
});

// expectedHeaders: usado por el perfil private-app (ops.nawemedia.com) para
// verificar headers de seguridad, pero disponible para cualquier entrada.

test('expectedHeaders: todos presentes y correctos, sin fails', async () => {
  const entry = {
    id: 'root', label: 'Root', path: '/', expectedFinalStatus: 200, canonicalCheck: false,
    expectedHeaders: {
      'strict-transport-security': true,
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
    },
  };
  const fetchImpl = makeFetch({
    [`${SITE}/`]: () => new Response('<html>ok</html>', {
      status: 200,
      headers: { 'strict-transport-security': 'max-age=63072000', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY' },
    }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
  assert.equal(findings.filter((f) => f.check === 'security-header' && f.severity === 'ok').length, 3);
});

test('expectedHeaders: header requerido (true) ausente, fail', async () => {
  const entry = {
    id: 'root', label: 'Root', path: '/', expectedFinalStatus: 200, canonicalCheck: false,
    expectedHeaders: { 'strict-transport-security': true },
  };
  const fetchImpl = makeFetch({
    [`${SITE}/`]: () => new Response('<html>ok</html>', { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail' && f.check === 'security-header');
  assert.equal(fails.length, 1);
  assert.match(fails[0].message, /strict-transport-security/);
});

test('expectedHeaders: valor exacto no coincide, fail', async () => {
  const entry = {
    id: 'root', label: 'Root', path: '/', expectedFinalStatus: 200, canonicalCheck: false,
    expectedHeaders: { 'x-content-type-options': 'nosniff' },
  };
  const fetchImpl = makeFetch({
    [`${SITE}/`]: () => new Response('<html>ok</html>', { status: 200, headers: { 'x-content-type-options': 'sniff' } }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail' && f.check === 'security-header');
  assert.equal(fails.length, 1);
});

test('expectedHeaders: se verifica sobre la respuesta final aunque no sea 200 (ej. el redirect de auth)', async () => {
  const entry = {
    id: 'root', label: 'Root', path: '/',
    expectedRedirect: { to: '/login', status: 307 },
    expectedFinalStatus: 200,
    canonicalCheck: false,
    expectedHeaders: { 'strict-transport-security': true },
  };
  const fetchImpl = makeFetch({
    [`${SITE}/`]: () => new Response(null, { status: 307, headers: { location: `${SITE}/login`, 'strict-transport-security': 'max-age=1' } }),
    [`${SITE}/login`]: () => new Response('<html>login</html>', { status: 200, headers: { 'strict-transport-security': 'max-age=1' } }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
});

// Patrón private-app (ops.nawemedia.com): raíz sin sesión redirige a /login
// (307) en vez de exponer contenido protegido con 200 directo.

test('patrón private-app: raíz sin sesión redirige a /login, sin fails', async () => {
  const entry = {
    id: 'root', label: 'Root', path: '/',
    expectedRedirect: { to: '/login', status: 307 },
    expectedFinalStatus: 200,
    canonicalCheck: false,
    expectedRobotsMeta: 'noindex, nofollow',
  };
  const fetchImpl = makeFetch({
    [`${SITE}/`]: () => new Response(null, { status: 307, headers: { location: `${SITE}/login` } }),
    [`${SITE}/login`]: () => new Response(html({ robots: 'noindex, nofollow' }), { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  assert.equal(findings.filter((f) => f.severity === 'fail').length, 0);
});

test('patrón private-app: raíz expone contenido con 200 directo sin sesión, fail (misma clase que Electric Side)', async () => {
  const entry = {
    id: 'root', label: 'Root', path: '/',
    expectedRedirect: { to: '/login', status: 307 },
    expectedFinalStatus: 200,
    canonicalCheck: false,
  };
  const fetchImpl = makeFetch({
    [`${SITE}/`]: () => new Response('<html>datos internos expuestos</html>', { status: 200 }),
  });
  const findings = await checkUrlEntry(entry, SITE, { fetchImpl });
  const fails = findings.filter((f) => f.severity === 'fail');
  assert.equal(fails.length, 1);
  assert.equal(fails[0].check, 'redirect');
});
