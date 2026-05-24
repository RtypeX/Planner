// Thin wrapper around Google's Generative Language API.
// Keeps the API casing (systemInstruction camelCase) and request shape
// in one place so SheetsImport, the chatbot, and the weekly summary can
// all share it.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
export const DEFAULT_MODEL = 'gemini-2.0-flash'

/**
 * Generic content generation. Pass a list of `contents` (the conversation),
 * an optional system instruction, optional function-calling `tools`, and
 * generation config. Returns the raw response so the caller can decide what
 * to do with text vs. functionCall parts.
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

  const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
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

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) + '…' : s
}
