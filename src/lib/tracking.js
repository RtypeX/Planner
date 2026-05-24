// Carrier detection + tracking deeplinks + remote refresh helper.
// The browser cannot call UPS directly (CORS + OAuth secret), so live status
// goes through a small proxy you deploy yourself (see /worker/README.md).

export const CARRIERS = ['UPS', 'USPS', 'FedEx']

const UPS_RE = /^1Z[0-9A-Z]{16}$/i
const FEDEX_RE = /^(?:\d{12}|\d{15}|\d{20})$/
const USPS_RE = /^(?:\d{20,22}|9[0-5]\d{18,20}|[A-Z]{2}\d{9}US)$/i

/** Best-effort carrier guess from the tracking number. Defaults to UPS. */
export function detectCarrier(number) {
  const n = (number || '').toString().trim().replace(/\s+/g, '')
  if (!n) return ''
  if (UPS_RE.test(n)) return 'UPS'
  if (USPS_RE.test(n)) return 'USPS'
  if (FEDEX_RE.test(n)) return 'FedEx'
  return 'UPS' // most packages are UPS in this workflow
}

/** Public carrier tracking URL — works without any API. */
export function trackingUrl(number, carrier) {
  const n = encodeURIComponent((number || '').toString().trim())
  if (!n) return ''
  switch ((carrier || '').toUpperCase()) {
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`
    case 'FEDEX':
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`
    case 'UPS':
    default:
      return `https://www.ups.com/track?loc=en_US&tracknum=${n}&requester=ST/`
  }
}

/** Normalize a UPS-ish status code to a display tone. */
export function statusTone(code, status) {
  const c = (code || '').toUpperCase()
  if (c === 'D' || /delivered/i.test(status || '')) return 'emerald'
  if (c === 'O' || /out for delivery/i.test(status || '')) return 'brand'
  if (c === 'I' || c === 'IT' || /in transit/i.test(status || '')) return 'amber'
  if (c === 'X' || /exception|delay|return/i.test(status || '')) return 'rose'
  if (c === 'M' || c === 'MV' || /label|manifest|pickup/i.test(status || '')) return 'slate'
  if (c === 'P') return 'slate'
  return 'slate'
}

/** Friendlier short label when raw status is missing/ugly. */
export function shortStatus(status, code) {
  if (status) return status
  const map = {
    D: 'Delivered',
    O: 'Out for delivery',
    I: 'In transit',
    IT: 'In transit',
    X: 'Exception',
    M: 'Label created',
    MV: 'Origin scan',
    P: 'Picked up',
    RS: 'Returning to sender',
  }
  return map[(code || '').toUpperCase()] || ''
}

/**
 * Call your deployed proxy to fetch live tracking.
 * Contract: GET {proxyUrl}/track?number=XXX&carrier=UPS
 * Response: { status, code, lastUpdate, deliveredAt, events?: [...] }
 */
export async function fetchTracking({ proxyUrl, trackingNumber, carrier }) {
  if (!proxyUrl) throw new Error('Tracking API not configured. Add a proxy URL in Settings.')
  if (!trackingNumber) throw new Error('No tracking number on this cycle.')
  const base = proxyUrl.replace(/\/$/, '')
  const url = `${base}/track?number=${encodeURIComponent(trackingNumber)}${
    carrier ? `&carrier=${encodeURIComponent(carrier)}` : ''
  }`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  let body = null
  try { body = await res.json() } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = body?.error || body?.message || `${res.status} ${res.statusText}`
    throw new Error(msg)
  }
  if (body?.error) throw new Error(body.error)
  return body
}

/** Ping the proxy's /health endpoint. */
export async function pingProxy(proxyUrl) {
  if (!proxyUrl) throw new Error('No proxy URL set')
  const base = proxyUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/health`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return await res.json().catch(() => ({ ok: true }))
}
