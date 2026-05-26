// Vercel Edge Middleware — gates the entire app behind password + PIN.
//
// Runs at the edge before any HTML/JS is served. The static bundle is never
// reachable until the user has a valid signed session cookie.
//
// Required env vars (Vercel project → Settings → Environment Variables):
//   AUTH_PASSWORD_HASH  format "<salt_hex>:<hash_hex>" — generate with `npm run hash-password`
//   AUTH_PIN_HASH       format "<salt_hex>:<hash_hex>" — generate with `npm run hash-pin`
//   AUTH_SECRET         random 64-char hex — generate with `npm run hash-password`
//
// If any are missing, middleware passes through (so local dev / preview
// without env vars still works). For production set all three.

export const config = {
  // Run middleware on everything except the favicon (which the login page
  // itself needs to load before authentication).
  matcher: '/((?!favicon\\.svg).*)',
}

const COOKIE_NAME = 'hq_session'
const SESSION_DAYS = 7
const PBKDF2_ITERATIONS = 100_000

const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || ''
const AUTH_PIN_HASH      = process.env.AUTH_PIN_HASH || ''
const AUTH_SECRET        = process.env.AUTH_SECRET || ''

const enc = new TextEncoder()

export default async function middleware(request) {
  // Bypass entirely if not configured (local dev safety)
  if (!AUTH_PASSWORD_HASH || !AUTH_PIN_HASH || !AUTH_SECRET) return

  const url = new URL(request.url)
  const path = url.pathname

  if (path === '/__auth/login' && request.method === 'POST') return handleLogin(request)
  if (path === '/__auth/logout') return handleLogout()

  // Already authenticated? Pass through.
  const cookie = readCookie(request.headers.get('cookie') || '', COOKIE_NAME)
  if (cookie && await verifySession(cookie)) return

  // Otherwise serve the login page.
  return new Response(loginHtml(url.searchParams.get('error')), {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

// ─── Handlers ────────────────────────────────────────────────────────

async function handleLogin(request) {
  const form = await request.formData().catch(() => null)
  const password = (form?.get('password') || '').toString()
  const pin = (form?.get('pin') || '').toString().replace(/\D/g, '').slice(0, 6)

  // Verify both in parallel — total time is one PBKDF2, not two.
  // Final result is gated by AND so an attacker can't tell which failed.
  const [passwordOk, pinOk] = await Promise.all([
    password ? verifyHashed(password, AUTH_PASSWORD_HASH) : Promise.resolve(false),
    pin ? verifyHashed(pin, AUTH_PIN_HASH) : Promise.resolve(false),
  ])

  if (!passwordOk || !pinOk) {
    // Artificial delay throttles online guessing.
    await sleep(500)
    return redirect('/?error=invalid')
  }

  const token = await createSession()
  const headers = new Headers()
  headers.set('Location', '/')
  headers.append('Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS * 86400}`,
  )
  return new Response(null, { status: 303, headers })
}

function handleLogout() {
  const headers = new Headers()
  headers.set('Location', '/')
  headers.append('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`)
  return new Response(null, { status: 303, headers })
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { Location: location } })
}

// ─── Crypto ──────────────────────────────────────────────────────────

async function verifyHashed(input, stored) {
  const [saltHex, expectedHex] = (stored || '').split(':')
  if (!saltHex || !expectedHex) return false
  const salt = hexToBytes(saltHex)
  const key = await crypto.subtle.importKey('raw', enc.encode(input), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return constantTimeEqual(bytesToHex(new Uint8Array(bits)), expectedHex)
}

async function createSession() {
  const payload = base64UrlEncode(JSON.stringify({
    exp: Date.now() + SESSION_DAYS * 86400 * 1000,
    iat: Date.now(),
  }))
  const sig = await hmac(payload, AUTH_SECRET)
  return `${payload}.${sig}`
}

async function verifySession(token) {
  const dot = token.indexOf('.')
  if (dot < 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmac(payload, AUTH_SECRET)
  if (!constantTimeEqual(sig, expected)) return false
  try {
    const data = JSON.parse(base64UrlDecode(payload))
    return data?.exp && Date.now() < data.exp
  } catch {
    return false
  }
}

async function hmac(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return bytesToHex(new Uint8Array(sig))
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

// ─── Utilities ───────────────────────────────────────────────────────

function readCookie(header, name) {
  const parts = header.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return ''
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
  return atob(padded)
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

// ─── Login page ──────────────────────────────────────────────────────

function loginHtml(error) {
  const errorMsg = error === 'invalid' ? 'wrong password or pin.' : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<title>HQ</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #000;
    color: #fff;
    overflow: hidden;
  }
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background:
      radial-gradient(60vw 60vw at 80% 20%, rgba(10,132,255,0.30), transparent 60%),
      radial-gradient(50vw 50vw at 0% 80%, rgba(94,92,230,0.24), transparent 60%),
      radial-gradient(50vw 50vw at 50% 110%, rgba(191,90,242,0.22), transparent 60%);
    animation: pan 22s ease-in-out infinite;
  }
  @keyframes pan {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50%      { transform: translate3d(4%, 2%, 0); }
  }
  .wrap {
    position: relative; z-index: 1;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 380px;
    padding: 32px 28px;
    background: rgba(28, 28, 36, 0.55);
    backdrop-filter: blur(60px) saturate(200%);
    -webkit-backdrop-filter: blur(60px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 28px;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.10) inset,
      0 0 0 0.5px rgba(255,255,255,0.10),
      0 24px 64px -12px rgba(0,0,0,0.50);
    animation: pop 480ms cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes pop {
    0%   { opacity: 0; transform: scale(0.92); }
    70%  { opacity: 1; transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1); }
  }
  .lockup {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }
  .mark {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #0a84ff, #5e5ce6, #bf5af2);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.20) inset,
      0 8px 24px -4px rgba(10,132,255,0.40);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.02em;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0;
    line-height: 1.1;
  }
  .sub {
    font-size: 13px;
    color: rgba(235,235,245,0.60);
    margin-top: 2px;
    font-weight: 500;
  }
  form { margin-top: 8px; }
  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(235,235,245,0.60);
    margin-bottom: 6px;
    letter-spacing: 0;
  }
  .field { margin-bottom: 16px; }
  input[type=password], input[type=text] {
    width: 100%;
    background: rgba(255,255,255,0.04);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    font-family: inherit;
    font-size: 15px;
    padding: 11px 14px;
    outline: none;
    transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
    backdrop-filter: blur(20px);
  }
  input::placeholder { color: rgba(235,235,245,0.30); }
  input:focus {
    border-color: #0a84ff;
    background: rgba(255,255,255,0.06);
    box-shadow: 0 0 0 4px rgba(10,132,255,0.20);
  }
  input.pin {
    letter-spacing: 0.4em;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
  }
  button {
    margin-top: 8px;
    width: 100%;
    background: #0a84ff;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.20);
    border-radius: 12px;
    font-family: inherit;
    font-weight: 600;
    font-size: 15px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.20) inset,
      0 6px 16px -4px rgba(10,132,255,0.50);
  }
  button:hover {
    transform: translateY(-1px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.25) inset,
      0 12px 32px -6px rgba(10,132,255,0.60);
  }
  button:active { transform: scale(0.97); }
  .err {
    font-size: 12px;
    color: #ff453a;
    min-height: 18px;
    margin: 4px 0 8px;
    font-weight: 500;
  }
  .meta {
    margin-top: 28px;
    font-size: 11px;
    color: rgba(235,235,245,0.30);
    text-align: center;
    font-weight: 500;
  }
  ::selection { background: #0a84ff; color: #fff; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="lockup">
      <div class="mark">D</div>
      <div>
        <h1>Dylan's HQ</h1>
        <div class="sub">Locked · sign in to continue</div>
      </div>
    </div>
    <form method="POST" action="/__auth/login" autocomplete="off">
      <div class="field">
        <label for="pw">Password</label>
        <input id="pw" name="password" type="password" autofocus autocomplete="current-password" required>
      </div>
      <div class="field">
        <label for="pin">6-digit PIN</label>
        <input id="pin" name="pin" type="text" class="pin" inputmode="numeric" autocomplete="off" pattern="[0-9]{6}" maxlength="6" required>
      </div>
      <div class="err">${errorMsg}</div>
      <button type="submit">Unlock</button>
    </form>
    <div class="meta">Two-factor · Session expires after ${SESSION_DAYS} days</div>
  </div>
</div>
<script>
  const pw = document.getElementById('pw');
  const pin = document.getElementById('pin');
  pw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && pw.value && !pin.value) { e.preventDefault(); pin.focus(); }
  });
  pin.addEventListener('input', () => {
    pin.value = pin.value.replace(/\\D/g, '').slice(0, 6);
  });
</script>
</body>
</html>`
}
