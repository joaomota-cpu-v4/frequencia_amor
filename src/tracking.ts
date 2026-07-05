// Meta Pixel + Conversions API tracking with browser/server deduplication.

const PIXEL_IDS = ['457573061386079', '280093672683803', '3419148448260520'];

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function getFbc(): string | undefined {
  // fbc = fb.1.<timestamp>.<fbclid>
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    document.cookie = `_fbc=${fbc};path=/;max-age=2592000;SameSite=Lax`;
    return fbc;
  }
  return getCookie('_fbc') || undefined;
}

function getFbp(): string | undefined {
  // fbp = fb.1.<timestamp>.<random> — Facebook's browser ID
  let fbp = getCookie('_fbp');
  if (!fbp) {
    fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
    document.cookie = `_fbp=${fbp};path=/;max-age=2592000;SameSite=Lax`;
  }
  return fbp;
}

function getExternalId(): string {
  // Stable anonymous ID per visitor, persisted in localStorage
  const KEY = 'vdl_external_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `ext_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

async function sendServerEvent(payload: {
  eventName: 'PageView' | 'Lead';
  eventId: string;
  fbc?: string;
  fbp?: string;
  externalId: string;
}) {
  try {
    await fetch('/api/meta-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        eventSourceUrl: window.location.href,
      }),
      keepalive: true,
    });
  } catch {
    // Browser Pixel remains the fallback if the server event cannot be sent.
  }
}

export function trackLead() {
  const fbq = window.fbq;
  const fbc = getFbc();
  const fbp = getFbp();
  const externalId = getExternalId();
  const eventId = crypto.randomUUID
    ? `lead_${crypto.randomUUID()}`
    : `lead_${externalId}_${Date.now()}`;

  if (fbq) {
    PIXEL_IDS.forEach((pixelId) => {
      fbq('trackSingle', pixelId, 'Lead', {
        value: 15.90,
        currency: 'USD',
        content_name: 'Metodo Vibracion del Amor',
      }, { eventID: eventId });
    });
  }

  void sendServerEvent({ eventName: 'Lead', eventId, fbc, fbp, externalId });
}

export function trackPageView() {
  const fbq = window.fbq;
  const fbc = getFbc();
  const fbp = getFbp();
  const externalId = getExternalId();
  const eventId = crypto.randomUUID
    ? `pageview_${crypto.randomUUID()}`
    : `pageview_${externalId}_${Date.now()}`;

  if (fbq) {
    PIXEL_IDS.forEach((pixelId) => {
      fbq('trackSingle', pixelId, 'PageView', {}, { eventID: eventId });
    });
  }

  void sendServerEvent({ eventName: 'PageView', eventId, fbc, fbp, externalId });
}
