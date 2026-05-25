import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, X, Check, ChevronDown, AlertTriangle, RotateCcw } from 'lucide-react'
import { useAppData } from '../lib/AppData'
import { generate, extractFunctionCalls, extractText } from '../lib/gemini'
import { AI_TOOLS, AI_TOOL_BY_NAME, buildGeminiTools, summarizeState } from '../lib/aiTools'

const SYSTEM_PROMPT = `You're a sharp friend who helps Dylan run his planner app. Tracks an iPhone arbitrage hustle, BMT-prep fitness, life milestones, and finances.

Voice rules — read these:
- Talk like a person texting, not a chatbot. Short sentences. Lowercase fine.
- Never say "I'd be happy to", "Of course!", "Certainly", "great question", or any opener that sounds like a customer-service script.
- No filler ("Just to clarify", "It seems like", "I understand that"). Get to the point.
- Skip bullet lists unless you're literally listing 3+ things. Default to flowing sentences.
- One- or two-sentence answers when one or two sentences will do.
- When you log something for him, your reply is one short line of confirmation, not a recap. e.g. "logged. 45 push-ups today." — not "I've gone ahead and logged your workout..."
- If you don't know, say so plainly.

Function calls:
ALWAYS prefer a function call when Dylan describes a concrete entry to add (cycle, workout, milestone, study session, balance update). Don't restate what you're about to do, just do it.
If a required value is missing, ask one short clarifying question first — no preamble.
Use the state snapshot in the first message to fill plausible defaults from his phone-model presets, but never invent values he stated himself.

For status questions ("what's my best run time?"), answer in one line with the number.`

export default function AssistantPanel({ open, onClose }) {
  const app = useAppData()
  const { settings, showToast } = app
  const apiKey = settings.geminiApiKey || ''

  const [messages, setMessages] = useState([
    { role: 'assistant', text: "what do you need? paste sheet rows, describe a cycle, log a workout — anything." },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingTools, setPendingTools] = useState([])
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const stateSnapshot = useMemo(
    () => summarizeState(app),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app.cycles, app.workouts, app.milestones, app.balance, app.asvab, app.phoneModels],
  )

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80) }, [open])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, pendingTools, busy])

  const sendMessage = async (text) => {
    if (!text?.trim() || busy) return
    if (!apiKey) {
      showToast({ type: 'error', title: 'No API key', message: 'Add a Gemini key in Settings.' })
      return
    }

    const userMsg = { role: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setBusy(true)

    try {
      const contents = [
        {
          role: 'user',
          parts: [{ text: `Current app state (JSON):\n${JSON.stringify(stateSnapshot, null, 2)}` }],
        },
        { role: 'model', parts: [{ text: 'got it.' }] },
        ...nextMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text }],
        })),
      ]

      const response = await generate({
        apiKey,
        model: settings.geminiModel,
        systemInstruction: SYSTEM_PROMPT,
        contents,
        tools: buildGeminiTools(),
        generationConfig: { temperature: 0.7 },
      })

      const calls = extractFunctionCalls(response)
      const text = extractText(response)
      const validatedCalls = calls
        .filter((c) => AI_TOOL_BY_NAME[c.name])
        .map((c) => ({ ...c, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))

      const assistantMsg = {
        role: 'assistant',
        text: text || (validatedCalls.length ? `drafted ${validatedCalls.length} ${validatedCalls.length === 1 ? 'change' : 'changes'} below.` : '…'),
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (validatedCalls.length) setPendingTools((prev) => [...prev, ...validatedCalls])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        error: true,
        text: err.message || String(err),
      }])
    } finally {
      setBusy(false)
    }
  }

  const applyOne = (id) => {
    const item = pendingTools.find((t) => t.id === id)
    if (!item) return
    const tool = AI_TOOL_BY_NAME[item.name]
    try {
      const desc = tool.apply(app, item.args)
      setPendingTools((prev) => prev.filter((t) => t.id !== id))
      setMessages((prev) => [...prev, { role: 'system', text: desc }])
    } catch (err) {
      showToast({ type: 'error', title: 'Apply failed', message: err.message || String(err) })
    }
  }

  const applyAll = () => {
    let count = 0
    let lastError = ''
    pendingTools.forEach((item) => {
      const tool = AI_TOOL_BY_NAME[item.name]
      try { tool.apply(app, item.args); count += 1 } catch (err) { lastError = err.message }
    })
    setPendingTools([])
    if (count) {
      setMessages((prev) => [...prev, { role: 'system', text: `applied ${count} ${count === 1 ? 'change' : 'changes'}.` }])
    }
    if (lastError) showToast({ type: 'error', title: 'Some changes failed', message: lastError })
  }

  const dismiss = (id) => setPendingTools((prev) => prev.filter((t) => t.id !== id))

  const reset = () => {
    setMessages([{ role: 'assistant', text: "cleared. what's next?" }])
    setPendingTools([])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[65] flex justify-end animate-fade-in" role="dialog" aria-modal="true" aria-label="Assistant">
      <div className="absolute inset-0 bg-[var(--ink-1)]/40" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] h-full
                      bg-[var(--paper-1)]
                      border-l border-[var(--rule-strong)]
                      flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-[var(--rule)]">
          <div className="min-w-0">
            <div className="page-eyebrow">Assistant</div>
            <div className="font-display text-[var(--ink-1)] mt-1.5"
                 style={{ fontWeight: 500, fontSize: '18px', letterSpacing: '-0.02em' }}>
              {apiKey ? 'Ready' : 'No API key'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-icon" onClick={reset} title="Clear" aria-label="Clear">
              <RotateCcw size={14} strokeWidth={1.5} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {!apiKey && (
          <div className="m-5 px-4 py-3 bg-[var(--paper-2)] border border-[var(--rule)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--clay-500,#c45f3f)] mb-1.5">
              Setup needed
            </div>
            <div className="text-xs text-[var(--ink-2)]">
              Add a Gemini key in Settings → Gemini AI. Free tier is fine.
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m, i) => <Message key={i} message={m} />)}

          {/* Pending tool calls */}
          {pendingTools.length > 0 && (
            <div className="border border-[var(--accent)] bg-[var(--accent-soft)] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent)]">
                  Drafted · review
                </div>
                {pendingTools.length > 1 && (
                  <button className="text-[11px] font-medium text-[var(--accent)] hover:underline" onClick={applyAll}>
                    Apply all ({pendingTools.length})
                  </button>
                )}
              </div>
              <ul className="space-y-1.5">
                {pendingTools.map((t) => (
                  <PendingToolCard key={t.id} tool={t} onApply={() => applyOne(t.id)} onDismiss={() => dismiss(t.id)} />
                ))}
              </ul>
            </div>
          )}

          {busy && (
            <div className="flex gap-1 items-center text-[var(--ink-3)] px-1">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-soft-pulse" />
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-soft-pulse" style={{ animationDelay: '120ms' }} />
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-soft-pulse" style={{ animationDelay: '240ms' }} />
            </div>
          )}
        </div>

        {/* Suggestion chips */}
        {messages.length <= 1 && !busy && (
          <div className="px-5 pb-3 flex gap-2 flex-wrap">
            {[
              'log 45 pushups today',
              '2 iphone 16e ordered today',
              "what's my best run?",
              'asvab test next friday',
            ].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[11px] px-2.5 py-1.5 border border-[var(--rule)] text-[var(--ink-2)]
                           hover:border-[var(--ink-2)] hover:text-[var(--ink-1)] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[var(--rule)] p-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Tell me what to log…"
              rows={1}
              className="input flex-1 resize-none min-h-[40px] max-h-[140px]"
            />
            <button
              className="btn btn-primary btn-icon !w-10"
              onClick={() => sendMessage(input)}
              disabled={busy || !input.trim() || !apiKey}
              aria-label="Send"
            >
              <Send size={14} strokeWidth={1.7} />
            </button>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--ink-3)] mt-2 flex items-center gap-2 flex-wrap">
            <span>Approval required</span>
            <span className="opacity-50">·</span>
            <kbd className="kbd">↵</kbd> send
            <kbd className="kbd">⇧↵</kbd> newline
          </p>
        </div>
      </div>
    </div>
  )
}

function Message({ message }) {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-sage-500 px-1">
        <Check size={11} strokeWidth={2} />
        <span className="lowercase tracking-normal text-[12px] font-sans normal-case text-[var(--ink-2)]">
          {message.text}
        </span>
      </div>
    )
  }
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[var(--ink-1)] text-[var(--paper-0)] px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className={`max-w-[88%] px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
        message.error
          ? 'bg-clay-500/10 text-clay-600 border border-clay-500/30'
          : 'bg-[var(--paper-2)] text-[var(--ink-1)]'
      }`}>
        {message.error && <AlertTriangle size={12} strokeWidth={1.6} className="inline mr-1.5 -mt-0.5" />}
        {message.text}
      </div>
    </div>
  )
}

function PendingToolCard({ tool, onApply, onDismiss }) {
  const [expanded, setExpanded] = useState(false)
  const meta = AI_TOOL_BY_NAME[tool.name]
  const summary = meta?.summarize?.(tool.args) || tool.name
  return (
    <li className="bg-[var(--paper-1)] border border-[var(--rule)] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <div className="text-sm text-[var(--ink-1)]">{summary}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--ink-3)] mt-1 flex items-center gap-1">
            {tool.name}
            <ChevronDown size={10} className={`transition ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button className="btn btn-ghost btn-icon" onClick={onDismiss} aria-label="Dismiss">
            <X size={12} strokeWidth={1.5} />
          </button>
          <button className="btn btn-accent !py-1 !px-2 text-xs" onClick={onApply}>
            <Check size={11} strokeWidth={2} /> Apply
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="mt-2 font-mono text-[10px] bg-[var(--paper-2)] border border-[var(--rule)] p-2 overflow-x-auto text-[var(--ink-2)]">
          {JSON.stringify(tool.args, null, 2)}
        </pre>
      )}
    </li>
  )
}
