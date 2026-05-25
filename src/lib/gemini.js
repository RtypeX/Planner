// Thin wrapper around Google's Generative Language API.
// Keeps the API casing (systemInstruction camelCase) and request shape
// in one place so SheetsImport, the chatbot, and the weekly summary can
// all share it.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash-lite', label: '2.5 Flash Lite', sub: 'Highest free quota · fastest' },
  { id: 'gemini-2.0-flash-lite', label: '2.0 Flash Lite', sub: 'High free quota · fast' },
  { id: 'gemini-2.0-flash',      label: '2.0 Flash',      sub: 'Balanced quality · stricter limits' },
  { id: 'gemini-2.5-flash',      label: '2.5 Flash',      sub: 'Best quality · strictest free limits' },
]

export const DEFAULT_MODEL = 'gemini-2.0-flash-lite'

/**
 * Generic content generation. Pass a list of `contents` (the conversation),
 * an optional system instruction, optional function-calling `tools`, and
 * generation config. Returns the raw response so the caller can decide what
 * to do with text vs. functionCall parts.
 *
 * Automatically retries once on 429 (rate-limit) with a short backoff so a
 * single per-minute hit doesn't bubble up to the user.
 */
export async function generate({
  apiKey,
  model = DEFAULT_MODEL,
  systemInstruction,
  contents,
  tools,
  toolConfig,
  generationConfig = { temperature: 0.4 },
  signal,
}) {
  if (!apiKey) throw new Error('Gemini API key not set. Add one in Settings.')
  const body = { contents, generationConfig }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }
  if (tools) body.tools = tools
  if (toolConfig) body.toolConfig = toolConfig

  const url = `${ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }

  let res = await fetch(url, init)

  // Single retry on 429 — Gemini's per-minute limits reset fast, so one
  // sleep of ~6s is usually enough.
  if (res.status === 429) {
    const retryAfter = parseRetryAfter(res) ?? 6000
    await sleep(Math.min(retryAfter, 15000), signal)
    res = await fetch(url, init)
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    if (res.status === 429) {
      throw new Error(formatRateLimitError(txt))
    }
    throw new Error(`Gemini ${res.status}: ${truncate(txt, 240)}`)
  }
  return await res.json()
}

/** Pull the first text part out of a Gemini response. */
export function extractText(response) {
  const parts = response?.candidates?.[0]?.content?.parts || []
  return parts.map((p) => p.text).filter(Boolean).join('\n').trim()
}

/** Pull all functionCall parts (Gemini may return multiple). */
export function extractFunctionCalls(response) {
  const parts = response?.candidates?.[0]?.content?.parts || []
  return parts
    .filter((p) => p.functionCall)
    .map((p) => ({ name: p.functionCall.name, args: p.functionCall.args || {} }))
}

/** Strip ```json ... ``` fences and parse. */
export function parseJsonish(text) {
  const cleaned = String(text || '').replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

// ────────────────────────────────────────────────────────────────────────
// helpers

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) + '…' : s
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}

/**
 * Gemini sometimes encodes a retry hint in the error body's
 * RetryInfo. Pull it out if present, otherwise return null.
 */
function parseRetryAfter(res) {
  const header = res.headers.get('retry-after')
  if (header) {
    const secs = Number(header)
    if (Number.isFinite(secs) && secs > 0) return secs * 1000
  }
  return null
}

/**
 * Friendlier rate-limit message — the raw 429 dump is huge.
 * Detects per-minute vs per-day and tells the user when to retry.
 */
function formatRateLimitError(rawBody) {
  let body
  try { body = JSON.parse(rawBody) } catch { body = null }
  const detail = body?.error?.message || ''
  const isDaily = /per\s*day|daily/i.test(detail)
  if (isDaily) {
    return 'Gemini daily free quota exceeded. Try again after midnight Pacific, or switch to a higher-quota model in Settings → Gemini AI.'
  }
  return 'Gemini per-minute rate limit hit. Wait ~60 seconds and try again, or switch to a Flash Lite model in Settings → Gemini AI.'
}
