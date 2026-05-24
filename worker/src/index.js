// Dylan's HQ — UPS tracking proxy (Cloudflare Worker)
//
// Endpoints:
//   GET /health                    -> { ok: true, version }
//   GET /track?number=XXX&carrier=UPS
//                                  -> { status, code, lastUpdate, deliveredAt, events: [...] }
//
// Required Worker secrets:
//   UPS_CLIENT_ID, UPS_CLIENT_SECRET
//
// Optional Worker secrets/vars:
//   ALLOWED_ORIGIN  — exact origin to allow CORS for (e.g. https://dylanshq.example.com)
//                     defaults to "*" if unset
//   UPS_ENV         — "prod" (default) or "test" to hit UPS sandbox endpoints

const VERSION = '1.0.0'

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(env, request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return json({ ok: true, version: VERSION, message: 'Tracking proxy alive' }, 200, cors)
    }

    if (url.pathname === '/track' && request.method === 'GET') {
      const number = (url.searchParams.get('number') || '').trim()
      const carrier = (url.searchParams.get('carrier') || 'UPS').trim().toUpperCase()
      if (!number) return json({ error: 'missing tracking number' }, 400, cors)
      if (carrier !== 'UPS') {
        // Only UPS is wired up here. Extend with USPS/FedEx if you want.
        return json({ error: `carrier ${carrier} not supported by this proxy` }, 400, cors)
      }
      try {
        const token = await getUpsToken(env)
        const data = await fetchUps(number, token, env)
        return json(normalizeUps(data), 200, cors)
      } catch (err) {
        return json({ error: err.message || String(err) }, 502, cors)
      }
    }

    return json({ error: 'not found' }, 404, cors)
  },
}

function corsHeaders(env, request) {
  const reqOrigin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGIN || '').trim()
  let origin = '*'
  if (allowed) {
    // If a single origin is configured, only echo it back when it matches.
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

function upsBase(env) {
  return env.UPS_ENV === 'test'
    ? 'https://wwwcie.ups.com'
    : 'https://onlinetools.ups.com'
}

async function getUpsToken(env) {
  if (!env.UPS_CLIENT_ID || !env.UPS_CLIENT_SECRET) {
    throw new Error('UPS_CLIENT_ID / UPS_CLIENT_SECRET not configured on the Worker')
  }
  const auth = btoa(`${env.UPS_CLIENT_ID}:${env.UPS_CLIENT_SECRET}`)
  const res = await fetch(`${upsBase(env)}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`UPS auth failed (${res.status}): ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  if (!data.access_token) throw new Error('UPS auth: no access_token in response')
  return data.access_token
}

async function fetchUps(number, token, env) {
  const transId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now())
  const res = await fetch(
    `${upsBase(env)}/api/track/v1/details/${encodeURIComponent(number)}?locale=en_US&returnSignature=false`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'transId': transId,
        'transactionSrc': 'dylans-hq',
        'Accept': 'application/json',
      },
    },
  )
  const text = await res.text()
  if (!res.ok) {
    let msg = `UPS tracking failed (${res.status})`
    try {
      const errJson = JSON.parse(text)
      const responseErr =
        errJson?.response?.errors?.[0]?.message ||
        errJson?.errors?.[0]?.message ||
        errJson?.trackResponse?.shipment?.[0]?.warnings?.[0]?.message
      if (responseErr) msg += `: ${responseErr}`
    } catch { /* not JSON */ }
    throw new Error(msg)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('UPS tracking: invalid JSON in response')
  }
}

function normalizeUps(data) {
  const pkg = data?.trackResponse?.shipment?.[0]?.package?.[0]
  if (!pkg) {
    return { status: 'Unknown', code: '', lastUpdate: null, deliveredAt: null, events: [] }
  }
  const activity = Array.isArray(pkg.activity) ? pkg.activity : []
  const last = activity[0] || {}
  const status = last?.status?.description || pkg?.currentStatus?.description || 'Unknown'
  const code = last?.status?.code || pkg?.currentStatus?.code || ''

  // UPS uses { date: 'YYYYMMDD', time: 'HHMMSS' }
  const toIso = (a) => {
    if (!a?.date) return null
    const d = a.date
    const t = a.time && a.time.length >= 4 ? a.time : '000000'
    if (d.length !== 8) return null
    const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6) || '00'}Z`
    return iso
  }

  const delivered = activity.find((a) => {
    const c = (a?.status?.code || '').toUpperCase()
    const t = (a?.status?.type || '').toUpperCase()
    return c === 'D' || t === 'D' || /delivered/i.test(a?.status?.description || '')
  })

  const events = activity.slice(0, 25).map((a) => ({
    date: toIso(a),
    description: a?.status?.description || '',
    code: a?.status?.code || '',
    location: [
      a?.location?.address?.city,
      a?.location?.address?.stateProvince,
      a?.location?.address?.country,
    ].filter(Boolean).join(', '),
  }))

  return {
    status,
    code,
    lastUpdate: toIso(last),
    deliveredAt: delivered ? toIso(delivered) : null,
    events,
    deliveryDate: pkg?.deliveryDate?.[0]?.date || null,
  }
}
