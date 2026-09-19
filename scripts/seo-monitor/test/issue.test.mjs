import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncIssue } from '../lib/issue.mjs';

const REPO = 'Nawemediagmail/NAWEMEDIA-WEB';
const MARKER = '<!-- seo-monitor:managed-issue -->';

function makeFetch({ existingIssues = [] } = {}) {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method ?? 'GET', body: opts.body ? JSON.parse(opts.body) : null });
    const u = String(url);

    if (opts.method === undefined || opts.method === 'GET') {
      return new Response(JSON.stringify(existingIssues), { status: 200 });
    }
    if (opts.method === 'POST' && u.endsWith('/issues')) {
      return new Response(JSON.stringify({ number: 99 }), { status: 201 });
    }
    if (opts.method === 'PATCH') {
      return new Response(JSON.stringify({ number: Number(u.split('/').at(-1)) }), { status: 200 });
    }
    if (opts.method === 'POST' && u.includes('/comments')) {
      return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    }
    throw new Error(`mock sin manejar: ${opts.method} ${u}`);
  };
  return { fetchImpl, calls };
}

test('sin fails y sin issue previo: no hace nada', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [] });
  const result = await syncIssue({ repo: REPO, token: 't', failFindings: [], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'none');
  assert.ok(!calls.some((c) => c.method === 'POST' || c.method === 'PATCH'));
});

test('sin fails y con issue previo abierto: lo cierra y comenta', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [{ number: 5, body: `${MARKER}\nviejo` }] });
  const result = await syncIssue({ repo: REPO, token: 't', failFindings: [], runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'closed');
  assert.equal(result.number, 5);
  const patch = calls.find((c) => c.method === 'PATCH');
  assert.equal(patch.body.state, 'closed');
  assert.ok(calls.some((c) => c.method === 'POST' && c.url.includes('/comments')));
});

test('con fails y sin issue previo: crea uno nuevo con label seo-monitor', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [] });
  const failFindings = [{ check: 'canonical', message: 'canonical incorrecto en /presupuesto/' }];
  const result = await syncIssue({ repo: REPO, token: 't', failFindings, runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'created');
  const create = calls.find((c) => c.method === 'POST' && c.url.endsWith('/issues'));
  assert.ok(create);
  assert.deepEqual(create.body.labels, ['seo-monitor']);
  assert.match(create.body.body, /canonical incorrecto/);
});

test('con fails y con issue previo abierto: actualiza el mismo issue, no crea otro', async () => {
  const { fetchImpl, calls } = makeFetch({ existingIssues: [{ number: 7, body: `${MARKER}\nviejo` }] });
  const failFindings = [{ check: 'http', message: 'status inesperado' }];
  const result = await syncIssue({ repo: REPO, token: 't', failFindings, runUrl: 'https://x', fetchImpl });
  assert.equal(result.action, 'updated');
  assert.equal(result.number, 7);
  assert.ok(!calls.some((c) => c.method === 'POST' && c.url.endsWith('/issues')));
});
