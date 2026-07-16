// Función serverless privada: lista el historial de facturas generadas, leyendo
// las entradas guardadas en Cloudflare KV por /api/create-invoice.
// Requiere: ADMIN_PASSWORD, CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_KV_API_TOKEN

const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now - record.start > WINDOW_MS) {
    attempts.set(ip, { count: 1, start: now });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { password } = body || {};

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      await new Promise((r) => setTimeout(r, 700));
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    const { CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_KV_API_TOKEN } = process.env;
    if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_KV_API_TOKEN) {
      res.status(200).json({ ok: true, invoices: [], warning: 'El historial todavía no está configurado.' });
      return;
    }

    const base = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}`;
    const headers = { 'Authorization': `Bearer ${CF_KV_API_TOKEN}` };

    const listResp = await fetch(`${base}/keys?prefix=inv%3A&limit=1000`, { headers });
    if (!listResp.ok) {
      const errText = await listResp.text();
      res.status(502).json({ error: `No se pudo leer el historial: ${errText}` });
      return;
    }
    const listData = await listResp.json();
    const keys = (listData.result || []).map((k) => k.name).sort().reverse();

    const invoices = await Promise.all(
      keys.map(async (key) => {
        try {
          const vResp = await fetch(`${base}/values/${encodeURIComponent(key)}`, { headers });
          if (!vResp.ok) return null;
          const text = await vResp.text();
          return JSON.parse(text);
        } catch (_) {
          return null;
        }
      })
    );

    res.status(200).json({ ok: true, invoices: invoices.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error inesperado' });
  }
};
