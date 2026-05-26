import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, X, Check, ChevronDown, AlertTriangle, RotateCcw, Sparkles } from 'lucide-react'
import { useAppData } from '../lib/AppData'
import { generate, extractFunctionCalls, extractText } from '../lib/gemini'
import { AI_TOOL_BY_NAME, buildGeminiTools, summarizeState } from '../lib/aiTools'

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:w-[440px] h-full p-3 animate-spring-up sm:animate-fade-in">
        <div className="glass-strong h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--separator)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="icon-tile" style={{
                color: '#0a84ff',
                boxShadow: '0 0 0 1px rgba(10,132,255,0.30) inset, 0 1px 0 var(--glass-shine) inset',
              }}>
                <Sparkles size={15} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[var(--label-1)] tracking-tight">
                  Assistant
                </div>
                <div className="text-[11px] text-[var(--label-3)] truncate">
                  {apiKey ? 'gemini-2.0-flash · ready' : 'No API key'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="btn btn-ghost btn-icon" onClick={reset} title="Clear" aria-label="Clear">
                <RotateCcw size={14} strokeWidth={1.7} />
              </button>
              <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {!apiKey && (
            <div className="m-4 p-3 rounded-xl glass-thin">
              <div className="text-[12px] font-semibold text-sys-orange mb-1">
                Setup needed
              </div>
              <div className="text-[12px] text-[var(--label-2)]">
                Add a Gemini key in Settings → Gemini AI. Free tier is fine.
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => <Message key={i} message={m} />)}

            {/* Pending tool calls */}
            {pendingTools.length > 0 && (
              <div className="rounded-2xl p-3 space-y-2"
                   style={{
                     background: 'rgba(10, 132, 255, 0.10)',
                     backdropFilter: 'blur(20px) saturate(160%)',
                     border: '1px solid rgba(10, 132, 255, 0.25)',
                   }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sys-blue">
                    <Sparkles size={11} strokeWidth={2} className="animate-soft-pulse" /> Drafted changes
                  </div>
                  {pendingTools.length > 1 && (
                    <button className="text-[11px] font-semibold text-sys-blue hover:underline" onClick={applyAll}>
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
              <div className="flex gap-1 items-center text-[var(--label-3)] px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sys-blue animate-soft-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-sys-blue animate-soft-pulse" style={{ animationDelay: '120ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-sys-blue animate-soft-pulse" style={{ animationDelay: '240ms' }} />
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && !busy && (
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {[
                'log 45 pushups today',
                '2 iphone 16e ordered today',
                "what's my best run?",
                'asvab test next friday',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="badge hover:border-[var(--glass-stroke-2)] hover:text-[var(--label-1)] cursor-pointer transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[var(--separator)] p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Tell me what to log…"
                rows={1}
                className="input flex-1 resize-none min-h-[42px] max-h-[140px]"
              />
              <button
                className="btn btn-primary !w-11 !h-11 !p-0"
                onClick={() => sendMessage(input)}
                disabled={busy || !input.trim() || !apiKey}
                aria-label="Send"
              >
                <Send size={15} strokeWidth={2} />
              </button>
            </div>
            <p className="text-[11px] text-[var(--label-3)] mt-2 flex items-center gap-2 flex-wrap">
              <span>Approval required</span>
              <span className="opacity-50">·</span>
              <kbd className="kbd">↵</kbd> send
              <kbd className="kbd">⇧↵</kbd> newline
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Message({ message }) {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-2 text-[12px] text-sys-green px-1">
        <Check size={12} strokeWidth={2} />
        <span>{message.text}</span>
      </div>
    )
  }
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-sys-blue text-white px-3.5 py-2.5 rounded-2xl rounded-br-md text-[14px] whitespace-pre-wrap break-words shadow-glass-sm"
             style={{ background: 'linear-gradient(135deg, #0a84ff, #2e8aff)' }}>
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-[14px] whitespace-pre-wrap break-words ${
        message.error
          ? 'bg-sys-red/10 text-sys-red border border-sys-red/30'
          : 'glass-thin text-[var(--label-1)]'
      }`}>
        {message.error && <AlertTriangle size={12} strokeWidth={1.8} className="inline mr-1.5 -mt-0.5" />}
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
    <li className="rounded-xl p-2.5"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid var(--glass-stroke)',
        }}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <div className="text-[13px] font-medium text-[var(--label-1)]">{summary}</div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--label-3)] mt-1 flex items-center gap-1">
            {tool.name}
            <ChevronDown size={10} className={`transition ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button className="btn btn-ghost btn-icon !w-7 !h-7 !p-1" onClick={onDismiss} aria-label="Dismiss">
            <X size={12} strokeWidth={2} />
          </button>
          <button className="btn btn-primary !py-1 !px-2.5 text-[12px]" onClick={onApply}>
            <Check size={11} strokeWidth={2.4} /> Apply
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="mt-2 text-[10px] font-mono p-2 rounded-lg overflow-x-auto text-[var(--label-2)]"
             style={{ background: 'var(--glass-bg-thin)', border: '1px solid var(--separator)' }}>
          {JSON.stringify(tool.args, null, 2)}
        </pre>
      )}
    </li>
  )
}
