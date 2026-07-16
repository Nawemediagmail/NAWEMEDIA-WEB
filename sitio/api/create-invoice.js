// Función serverless privada: crea y envía una factura real de PayPal (Invoicing API v2).
// Requiere variables de entorno en Vercel: ADMIN_PASSWORD, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV ("sandbox" o "live")

// Rate limit best-effort en memoria (se resetea si la función se "enfría" en Vercel,
// pero igual frena intentos automatizados seguidos dentro de una misma instancia tibia).
const attempts = new Map();
const MAX_ATTEMPTS = 5;
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

// Log best-effort en Cloudflare KV (no bloquea la respuesta si falla)
async function logInvoice(entry) {
  const { CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_KV_API_TOKEN } = process.env;
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_KV_API_TOKEN) return;
  try {
    const key = `inv:${Date.now()}:${entry.invoiceId}`;
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CF_KV_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      }
    );
  } catch (_) { /* no crítico: el log es secundario a la factura real */ }
}

function paypalBase() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const base = paypalBase();
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error(`No se pudo autenticar con PayPal (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  return data.access_token;
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
    const { password, clientName, clientEmail, currency, dueDate, note, items } = body || {};

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      // Retraso artificial para dificultar fuerza bruta
      await new Promise((r) => setTimeout(r, 700));
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    if (!clientEmail || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Faltan datos: email del cliente y al menos un ítem' });
      return;
    }

    const base = paypalBase();
    const token = await getAccessToken();
    const curr = (currency || 'USD').toUpperCase();

    const invoicePayload = {
      detail: {
        currency_code: curr,
        note: note || '',
        payment_term: dueDate ? { due_date: dueDate } : undefined,
      },
      primary_recipients: [
        {
          billing_info: {
            email_address: clientEmail,
            name: clientName ? { full_name: clientName } : undefined,
          },
        },
      ],
      items: items.map((it) => ({
        name: it.name || 'Servicio',
        description: it.description || '',
        quantity: String(it.quantity || 1),
        unit_amount: { currency_code: curr, value: Number(it.unitPrice || 0).toFixed(2) },
      })),
    };

    const createResp = await fetch(`${base}/v2/invoicing/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      res.status(502).json({ error: `PayPal rechazó la creación de la factura: ${errText}` });
      return;
    }

    const created = await createResp.json();
    const invoiceHref = created.href || '';
    const invoiceId = invoiceHref.split('/').pop();

    const sendResp = await fetch(`${base}/v2/invoicing/invoices/${invoiceId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ send_to_recipient: true }),
    });

    if (!sendResp.ok) {
      const errText = await sendResp.text();
      res.status(502).json({ error: `La factura se creó (ID ${invoiceId}) pero no se pudo enviar: ${errText}` });
      return;
    }

    let recipientViewUrl = null;
    try {
      const detailsResp = await fetch(`${base}/v2/invoicing/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (detailsResp.ok) {
        const details = await detailsResp.json();
        recipientViewUrl = details?.detail?.metadata?.recipient_view_url || null;
      }
    } catch (_) { /* no crítico */ }

    const env = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
    const total = items.reduce((sum, it) => sum + Number(it.unitPrice || 0) * Number(it.quantity || 1), 0);

    await logInvoice({
      invoiceId,
      env,
      clientName: clientName || '',
      clientEmail,
      currency: curr,
      total: Number(total.toFixed(2)),
      note: note || '',
      recipientViewUrl,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      invoiceId,
      env,
      recipientViewUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error inesperado' });
  }
};
