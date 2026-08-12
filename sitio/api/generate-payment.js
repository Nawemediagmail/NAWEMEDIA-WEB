// Función serverless pública: genera y envía una factura real de PayPal (Invoicing API v2)
// para la propuesta "Fiestas OOPS" y devuelve el link para pagarla al toque.
// Reutiliza las mismas variables de entorno que create-invoice.js en Vercel:
// PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV ("sandbox" o "live")
// A diferencia de create-invoice.js (uso interno/admin), este endpoint no pide
// contraseña porque lo dispara el propio cliente, así que los montos e ítems
// están fijos acá (no llegan desde el request) para que no se puedan alterar.

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

const PLANS = {
  installment: {
    name: 'Fiestas OOPS — 5 Flyers Animados (Cuota 1 de 2)',
    description: '2 Cuotas 50/50 — Cuota 1 de 2. Cuota 2 se factura por separado.',
    unitPrice: 41,
    note: 'Plan 2 Cuotas · Fiestas OOPS · Cuota 1/2',
  },
  advance: {
    name: 'Fiestas OOPS — 5 Flyers Animados (Pago Total Anticipado)',
    description: 'Pago único anticipado antes de iniciar producción — código ADELANT15 (15% desc.)',
    unitPrice: 70,
    note: 'Pago Total Anticipado · Fiestas OOPS · ADELANT15',
  },
};

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

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    const { plan, clientEmail } = body || {};

    const planConfig = PLANS[plan];
    if (!planConfig) {
      res.status(400).json({ error: 'Plan de pago inválido' });
      return;
    }

    if (!isValidEmail(clientEmail)) {
      res.status(400).json({ error: 'Ingresá un email válido' });
      return;
    }

    const base = paypalBase();
    const token = await getAccessToken();

    const invoicePayload = {
      detail: {
        currency_code: 'USD',
        note: planConfig.note,
      },
      primary_recipients: [
        {
          billing_info: { email_address: clientEmail },
        },
      ],
      items: [
        {
          name: planConfig.name,
          description: planConfig.description,
          quantity: '1',
          unit_amount: { currency_code: 'USD', value: planConfig.unitPrice.toFixed(2) },
        },
      ],
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

    await logInvoice({
      invoiceId,
      env,
      source: 'fiestasoops_29ago',
      plan,
      clientEmail,
      currency: 'USD',
      total: planConfig.unitPrice,
      note: planConfig.note,
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
