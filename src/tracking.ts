// Facebook Pixel tracking utilities — captures fbc, fbp, external_id, geolocation
// and fires the Lead event on CTA clicks across all 3 pixels.

const PIXEL_IDS = ['457573061386079', '280093672683803', '3419148448260520'];

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function getFbc(): string | undefined {
  // fbc = fb.1.<timestamp>.<fbp_value> — Facebook's click ID from URL or cookie
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

async function getGeolocation(): Promise<{ city?: string; state?: string; country?: string } | undefined> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return undefined;
    const data = await res.json();
    return {
      city: data.city,
      state: data.region,
      country: data.country_name,
    };
  } catch {
    return undefined;
  }
}

export async function trackLead() {
  const fbq = window.fbq;
  if (!fbq) return;

  const fbc = getFbc();
  const fbp = getFbp();
  const externalId = getExternalId();
  const userData: Record<string, unknown> = {
    external_id: externalId,
  };
  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;

  const eventId = `lead_${externalId}_${Date.now()}`;
  PIXEL_IDS.forEach((pixelId) => {
    fbq('trackSingle', pixelId, 'Lead', {
      value: 15.90,
      currency: 'USD',
      content_name: 'Metodo Vibracion del Amor',
    }, { eventID: eventId });
  });

  // Do not delay the conversion event while waiting for the geolocation service.
  const geo = await getGeolocation();
  if (geo?.city) userData.city = geo.city;
  if (geo?.state) userData.state = geo.state;
  if (geo?.country) userData.country = geo.country;
  fbq('trackCustom', 'LeadUserData', userData);
}

// Fire PageView for all 3 pixels (in case index.html pixels need re-init)
export function trackPageView() {
  const fbq = window.fbq;
  if (!fbq) return;
  PIXEL_IDS.forEach((pixelId) => {
    fbq('trackSingle', pixelId, 'PageView');
  });
}
