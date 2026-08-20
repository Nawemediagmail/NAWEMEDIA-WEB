// Función serverless pública: genera y envía una factura real de PayPal (Invoicing API v2)
// para el refresh de colores/botones + rediseño de logotipo del EPK de Ambar Lombardi
// (con descuento por cliente habitual) y devuelve el link de la factura.
// Reutiliza las mismas variables de entorno que press-kit-payment.js / generate-payment.js en Vercel:
// PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV ("sandbox" o "live")
// No pide contraseña porque lo dispara el propio cliente: los precios están fijos acá
// (no llegan desde el request) para que no se puedan alterar.

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

const ITEMS = [
  {
    name: 'EPK Ambar Lombardi — Refresh de Colores y Botones',
    description: 'Actualización de paleta (verde + morado), ajuste de glows/sombras y botones con acabado metálico/3D sobre el EPK ya existente en ambarlombardi.com.',
    unitPrice: 45,
  },
  {
    name: 'Rediseño de Logotipo',
    description: 'Nueva tipografía sobre el mismo estilo de marca, en línea con la nueva paleta verde + morado.',
    unitPrice: 30,
  },
  {
    name: 'Descuento por Cliente Habitual',
    description: 'Descuento aplicado por ser cliente recurrente de NAWEMEDIA.',
    unitPrice: -20,
  },
];

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
    const { clientName, clientEmail } = body || {};

    if (!isValidEmail(clientEmail)) {
      res.status(400).json({ error: 'Ingresá un email válido' });
      return;
    }

    const base = paypalBase();
    const token = await getAccessToken();

    const invoicePayload = {
      detail: {
        currency_code: 'USD',
        note: 'EPK Ambar Lombardi · Refresh de Colores, Botones y Rediseño de Logotipo',
      },
      primary_recipients: [
        {
          billing_info: {
            email_address: clientEmail,
            name: clientName ? { full_name: String(clientName).trim() } : undefined,
          },
        },
      ],
      items: ITEMS.map((it) => ({
        name: it.name,
        description: it.description,
        quantity: '1',
        unit_amount: { currency_code: 'USD', value: it.unitPrice.toFixed(2) },
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
    const total = ITEMS.reduce((sum, it) => sum + it.unitPrice, 0);

    await logInvoice({
      invoiceId,
      env,
      source: 'lombardi-epk-refresh',
      clientName: clientName || '',
      clientEmail,
      currency: 'USD',
      total,
      recipientViewUrl,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      invoiceId,
      env,
      total,
      recipientViewUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error inesperado' });
  }
};
