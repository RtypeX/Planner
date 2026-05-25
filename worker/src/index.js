// Dylan's HQ — multi-carrier tracking proxy (Cloudflare Worker)
//
// Backed by TrackingMore v4. Supports UPS, USPS, FedEx, DHL, and 1,200+
// other carriers under one API key.
//
// Endpoints:
//   GET /health                                 -> { ok: true, version }
//   GET /track?number=XXX&carrier=UPS           -> normalized tracking JSON
//
// Required Worker secret:
//   TRACKINGMORE_API_KEY
//
// Optional:
//   ALLOWED_ORIGIN  — exact origin to allow CORS for (e.g. https://your-app.example.com)
//                     defaults to "*" if unset

const VERSION = '3.0.0-trackingmore'

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return json({ ok: true, version: VERSION, message: 'TrackingMore proxy alive' }, 200, cors)
    }

    if (url.pathname === '/track' && request.method === 'GET') {
      const number = (url.searchParams.get('number') || '').trim()
      const carrier = toCourierCode(url.searchParams.get('carrier'))
      if (!number) return json({ error: 'missing tracking number' }, 400, cors)
      try {
        const tracker = await getOrCreateTracker(number, carrier, env)
        return json(normalize(tracker), 200, cors)
      } catch (err) {
        return json({ error: err.message || String(err) }, 502, cors)
      }
    }

    return json({ error: 'not found' }, 404, cors)
  },
}

// ────────────────────────────────────────────────────────────────────────
// CORS

function corsHeaders(env, request) {
  const reqOrigin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGIN || '').trim()
  let origin = '*'
  if (allowed) {
    origin = allowed === '*' ? '*' : (reqOrigin === allowed ? allowed : allowed)
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}

// ────────────────────────────────────────────────────────────────────────
// TrackingMore

const TM_BASE = 'https://api.trackingmore.com/v4'

/** Map common carrier inputs to TrackingMore's lowercase courier codes. */
function toCourierCode(input) {
  const c = (input || '').trim().toLowerCase()
  if (!c) return ''
  const map = {
    ups:    'ups',
    usps:   'usps',
    fedex:  'fedex',
    dhl:    'dhl',
    other:  '',
  }
  return map[c] ?? c
}

function authHeaders(env) {
  if (!env.TRACKINGMORE_API_KEY) {
    throw new Error('TRACKINGMORE_API_KEY not configured on the Worker')
  }
  return {
    'Tracking-Api-Key': env.TRACKINGMORE_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
}

/**
 * Find or create a tracker on TrackingMore.
 *
 * Strategy:
 *   1. Try GET /trackings/get?tracking_numbers=XXX — if we already created one
 *      for this number, return it. Doesn't burn quota.
 *   2. Otherwise POST /trackings/create — TrackingMore v4 "create" is also
 *      "real-time", so it creates + scrapes + returns in one call. Costs one
 *      quota event but is the only way to onboard a new number.
 */
async function getOrCreateTracker(number, courierCode, env) {
  const headers = authHeaders(env)

  // Lookup existing
  const params = new URLSearchParams({ tracking_numbers: number })
  if (courierCode) params.set('courier_code', courierCode)
  const listRes = await fetch(`${TM_BASE}/trackings/get?${params.toString()}`, { headers })
  if (listRes.ok) {
    const data = await listRes.json().catch(() => ({}))
    const list = Array.isArray(data?.data) ? data.data : []
    if (list.length > 0) {
      // Prefer one matching the requested courier; otherwise take the first.
      const match = (courierCode && list.find((t) => sameCarrier(t.courier_code, courierCode))) || list[0]
      return match
    }
  } else if (listRes.status === 401 || listRes.status === 403) {
    const txt = await listRes.text().catch(() => '')
    throw new Error(`TrackingMore auth failed (${listRes.status}): ${truncate(txt, 200)}`)
  }

  // Create (real-time)
  const body = { tracking_number: number }
  if (courierCode) body.courier_code = courierCode

  const createRes = await fetch(`${TM_BASE}/trackings/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await createRes.text()
  if (!createRes.ok) {
    let msg = `TrackingMore create failed (${createRes.status})`
    try {
      const errJson = JSON.parse(text)
      const detail =
        errJson?.meta?.message ||
        errJson?.message ||
        errJson?.error ||
        ''
      if (detail) msg += `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
    } catch { /* not JSON */ }
    throw new Error(msg)
  }
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('TrackingMore: invalid JSON in create response')
  }
  // v4 returns { meta: {...}, data: {...} } for single create.
  // Some carriers are queued — `data` may have minimal info on the first call.
  return parsed?.data || parsed
}

function sameCarrier(a, b) {
  return (a || '').toString().toLowerCase() === (b || '').toString().toLowerCase()
}

/**
 * Translate a TrackingMore tracking record into the shape the React app
 * expects. The web app keys off short UPS-style status codes, so map
 * TrackingMore's `delivery_status` enum to those codes.
 */
function normalize(tracker) {
  if (!tracker) {
    return { status: 'Unknown', code: '', lastUpdate: null, deliveredAt: null, events: [] }
  }

  // TrackingMore v4 delivery_status enum:
  //   notfound | transit | pickup | delivered | undelivered | exception | expired
  const STATUS_TO_CODE = {
    delivered:    'D',
    pickup:       'O',  // out for delivery
    transit:      'I',
    undelivered:  'X',  // failed attempt
    exception:    'X',
    expired:      'X',
    notfound:     '',
    pending:      'M',  // sometimes returned during initial scrape
  }

  const ds = (tracker.delivery_status || tracker.status || 'notfound').toLowerCase()
  const code = STATUS_TO_CODE[ds] ?? ''
  const status = humanize(tracker.delivery_status || tracker.status || 'Unknown')

  // Events live in origin_info.trackinfo[] and/or destination_info.trackinfo[].
  // Merge them and sort newest-first.
  const originEvents = tracker.origin_info?.trackinfo || []
  const destEvents = tracker.destination_info?.trackinfo || []
  const allEvents = [...originEvents, ...destEvents]
    .filter(Boolean)
    .sort((a, b) => (a.checkpoint_date < b.checkpoint_date ? 1 : -1))

  const last = allEvents[0]
  const lastUpdate = toIso(last?.checkpoint_date) || tracker.latest_checkpoint_time || null

  // Find a delivered event if one exists.
  const deliveredEvent = allEvents.find((e) => {
    const s = (e.checkpoint_delivery_status || e.checkpoint_delivery_substatus || '').toLowerCase()
    return s === 'delivered' || s.startsWith('delivered')
  })
  const deliveredAt = toIso(deliveredEvent?.checkpoint_date)
    || (ds === 'delivered' ? lastUpdate : null)

  const events = allEvents.slice(0, 25).map((e) => ({
    date: toIso(e.checkpoint_date),
    description: e.tracking_detail || e.checkpoint_status || humanize(e.checkpoint_delivery_status || ''),
    code: STATUS_TO_CODE[(e.checkpoint_delivery_status || '').toLowerCase()] || '',
    location: e.location || [
      e.checkpoint_state, e.checkpoint_city, e.checkpoint_country,
    ].filter(Boolean).join(', '),
  }))

  return {
    status,
    code,
    lastUpdate,
    deliveredAt,
    events,
    deliveryDate: tracker.scheduled_delivery_date || null,
    carrier: tracker.courier_code || null,
  }
}

function humanize(s) {
  return String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** TrackingMore returns timestamps like "2024-05-23 14:32:00" — coerce to ISO. */
function toIso(s) {
  if (!s) return null
  const str = String(s).trim()
  // Already has a T (ISO) — return as-is.
  if (str.includes('T')) return str
  // YYYY-MM-DD HH:mm:ss with no timezone — assume UTC.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return str.replace(' ', 'T') + 'Z'
  }
  return str
}

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) + '…' : s
}
