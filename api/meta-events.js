import crypto from 'node:crypto';

const DEFAULT_PIXEL_IDS = ['457573061386079', '280093672683803', '3419148448260520'];
const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';

function firstHeader(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function clientIp(req) {
  const forwarded = firstHeader(req, 'x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.socket?.remoteAddress;
}

function normalize(value) {
  return value?.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function hash(value) {
  const normalized = normalize(value);
  return normalized ? crypto.createHash('sha256').update(normalized).digest('hex') : undefined;
}

function safeDecode(value) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function validString(value, maxLength = 500) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
    ? value
    : undefined;
}

function pixelConfig() {
  if (process.env.META_CAPI_CONFIG) {
    try {
      const config = JSON.parse(process.env.META_CAPI_CONFIG);
      return Object.entries(config).filter(([pixelId, token]) => /^\d+$/.test(pixelId) && typeof token === 'string');
    } catch {
      throw new Error('META_CAPI_CONFIG must be a valid JSON object');
    }
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return [];
  const pixelIds = (process.env.META_PIXEL_IDS || DEFAULT_PIXEL_IDS.join(','))
    .split(',')
    .map(value => value.trim())
    .filter(value => /^\d+$/.test(value));
  return pixelIds.map(pixelId => [pixelId, token]);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let config;
  try {
    config = pixelConfig();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Invalid server configuration' });
  }

  if (config.length === 0) {
    return res.status(503).json({ error: 'Meta CAPI is not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  const eventName = body.eventName === 'PageView' || body.eventName === 'Lead' ? body.eventName : undefined;
  const eventId = validString(body.eventId, 150);
  const externalId = validString(body.externalId, 200);
  const eventSourceUrl = validString(body.eventSourceUrl, 2048);

  if (!eventName || !eventId || !externalId || !eventSourceUrl) {
    return res.status(400).json({ error: 'Invalid event payload' });
  }

  const userData = {
    client_ip_address: clientIp(req),
    client_user_agent: firstHeader(req, 'user-agent'),
    fbc: validString(body.fbc, 500),
    fbp: validString(body.fbp, 500),
    external_id: [hash(externalId)],
    ct: [hash(safeDecode(firstHeader(req, 'x-vercel-ip-city')))],
    st: [hash(firstHeader(req, 'x-vercel-ip-country-region'))],
    country: [hash(firstHeader(req, 'x-vercel-ip-country'))],
  };

  for (const key of Object.keys(userData)) {
    const value = userData[key];
    if (value === undefined || (Array.isArray(value) && value[0] === undefined)) delete userData[key];
  }

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    ...(eventName === 'Lead' ? {
      custom_data: {
        currency: 'USD',
        value: 15.90,
        content_name: 'Metodo Vibracion del Amor',
      },
    } : {}),
  };

  const results = await Promise.all(config.map(async ([pixelId, accessToken]) => {
    const payload = { data: [event], access_token: accessToken };
    if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { pixelId, ok: response.ok, status: response.status, data };
  }));

  const failed = results.filter(result => !result.ok);
  if (failed.length > 0) {
    console.error('Meta CAPI errors', failed);
    return res.status(502).json({ ok: false, pixelCount: results.length, failedPixels: failed.map(item => item.pixelId) });
  }

  return res.status(200).json({ ok: true, pixelCount: results.length });
}
