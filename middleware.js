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
  matcher: '/((?!__auth/|favicon\\.svg|manifest\\.webmanifest|sw\\.js).*)',
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
<meta name="theme-color" content="#0a0908">
<title>HQ</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: Inter, system-ui, sans-serif;
    background: #0a0908;
    color: #f5f1e8;
    -webkit-font-smoothing: antialiased;
    background-image:
      radial-gradient(800px 400px at 80% 20%, rgba(207, 119, 38, 0.08), transparent 60%),
      radial-gradient(600px 400px at 20% 80%, rgba(58, 81, 109, 0.10), transparent 60%);
  }
  .wrap {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card { width: 100%; max-width: 360px; }
  .lockup {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 40px;
  }
  .mark {
    width: 14px; height: 14px; border-radius: 50%;
    background: #cf7726;
    flex-shrink: 0;
    transform: translateY(2px);
  }
  h1 {
    font-family: Fraunces, Georgia, serif;
    font-weight: 500;
    font-size: 22px;
    letter-spacing: -0.02em;
    margin: 0;
    color: #f5f1e8;
  }
  .sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #6b6862;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 4px;
  }
  form { margin-top: 8px; }
  label {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #6b6862;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .field { margin-bottom: 24px; }
  input[type=password], input[type=text] {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid #2a2925;
    color: #f5f1e8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    padding: 8px 0 10px;
    outline: none;
    transition: border-color 200ms;
  }
  input[type=password]:focus, input[type=text]:focus {
    border-bottom-color: #cf7726;
  }
  input.pin {
    letter-spacing: 0.5em;
    text-align: center;
    font-size: 18px;
  }
  button {
    margin-top: 8px;
    width: 100%;
    background: #f5f1e8;
    color: #0a0908;
    border: none;
    padding: 12px 16px;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: transform 100ms ease, background 200ms;
  }
  button:hover { background: #fff; }
  button:active { transform: scale(0.98); }
  .err {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #d97757;
    margin-top: 4px;
    margin-bottom: 16px;
    min-height: 18px;
  }
  .meta {
    margin-top: 56px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #4a4842;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  ::selection { background: #cf7726; color: #0a0908; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="lockup">
      <span class="mark"></span>
      <div>
        <h1>Dylan's HQ</h1>
        <div class="sub">Restricted</div>
      </div>
    </div>
    <form method="POST" action="/__auth/login" autocomplete="off">
      <div class="field">
        <label for="pw">Password</label>
        <input id="pw" name="password" type="password" autofocus autocomplete="current-password" required>
      </div>
      <div class="field">
        <label for="pin">PIN · 6 digits</label>
        <input id="pin" name="pin" type="text" class="pin" inputmode="numeric" autocomplete="off" pattern="[0-9]{6}" maxlength="6" required>
      </div>
      <div class="err">${errorMsg}</div>
      <button type="submit">Unlock</button>
    </form>
    <div class="meta">Two-factor · Session expires after ${SESSION_DAYS} days</div>
  </div>
</div>
<script>
  // Auto-advance to PIN field when password is filled and Enter is pressed,
  // and submit when PIN reaches 6 digits.
  const pw = document.getElementById('pw');
  const pin = document.getElementById('pin');
  pw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && pw.value && !pin.value) {
      e.preventDefault();
      pin.focus();
    }
  });
  pin.addEventListener('input', () => {
    pin.value = pin.value.replace(/\\D/g, '').slice(0, 6);
  });
</script>
</body>
</html>`
}
