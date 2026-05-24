import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send, Sparkles, X, Check, ChevronDown, AlertTriangle, RotateCcw, Plug } from 'lucide-react'
import { useAppData } from '../lib/AppData'
import { generate, extractFunctionCalls, extractText } from '../lib/gemini'
import { AI_TOOLS, AI_TOOL_BY_NAME, buildGeminiTools, summarizeState } from '../lib/aiTools'

const SYSTEM_PROMPT = `You are Dylan's HQ Assistant, a focused helper for a personal command-center app.
The app tracks an iPhone arbitrage hustle, BMT-prep fitness, life milestones, and finances.

You can use function calls to mutate the app state. ALWAYS prefer using a function call
when the user describes a concrete entry to add (a cycle, workout, milestone, study session).
Never invent values — if a required value is missing, ask one short clarifying question first.
For status questions ("what's my best run time?"), answer in plain text using the state below.

Today's date and a snapshot of the user's current state are provided in the first system message.
Phone-model defaults (cost, MobileX fee, trade-in value) are also there — use them to fill in
plausible values when the user doesn't specify, but always preserve what the user does say.

Keep responses short and concrete. Use bullet lists when listing multiple items.`

/**
 * Floating slide-out chat panel.
 *
 * The bot is allowed to *propose* mutations via function calls; the user has
 * to click "Apply" before anything actually writes to localStorage. This keeps
 * the LLM from corrupting the user's data on a hallucination.
 */
export default function AssistantPanel({ open, onClose }) {
  const app = useAppData()
  const { settings, showToast } = app
  const apiKey = settings.geminiApiKey || ''

  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey — paste rows from your sheet, describe a cycle, or ask me anything. I can also log workouts and milestones for you." },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingTools, setPendingTools] = useState([]) // [{ name, args, id }]
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Snapshot is rebuilt every send so the bot always sees fresh state.
  const stateSnapshot = useMemo(
    () => summarizeState(app),
    // Including primitives keeps the dependency list stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app.cycles, app.workouts, app.milestones, app.balance, app.asvab, app.phoneModels],
  )

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, pendingTools, busy])

  const sendMessage = async (text) => {
    if (!text?.trim() || busy) return
    if (!apiKey) {
      showToast({ type: 'error', title: 'Gemini key required', message: 'Add a key in Settings → Gemini AI.' })
      return
    }

    const userMsg = { role: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setBusy(true)

    try {
      // Build the conversation in Gemini format. The first system message
      // carries the freshly-rebuilt state snapshot.
      const contents = [
        // Gemini doesn't support `system` role inside contents, so we
        // prepend a "user" message with the snapshot. The actual system
        // instruction is sent as systemInstruction.
        {
          role: 'user',
          parts: [{ text: `Current app state (JSON):\n${JSON.stringify(stateSnapshot, null, 2)}` }],
        },
        { role: 'model', parts: [{ text: 'Got it — I have the current state. What can I help with?' }] },
        ...nextMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text }],
        })),
      ]

      const response = await generate({
        apiKey,
        systemInstruction: SYSTEM_PROMPT,
        contents,
        tools: buildGeminiTools(),
        generationConfig: { temperature: 0.3 },
      })

      const calls = extractFunctionCalls(response)
      const text = extractText(response)

      const validatedCalls = calls
        .filter((c) => AI_TOOL_BY_NAME[c.name])
        .map((c) => ({ ...c, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))

      const assistantMsg = {
        role: 'assistant',
        text: text || (validatedCalls.length ? `I drafted ${validatedCalls.length} change${validatedCalls.length === 1 ? '' : 's'} below — review and apply.` : '…'),
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (validatedCalls.length) {
        setPendingTools((prev) => [...prev, ...validatedCalls])
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        error: true,
        text: `Failed: ${err.message || String(err)}`,
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
      setMessages((prev) => [...prev, { role: 'system', text: `✓ Applied: ${desc}` }])
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
      setMessages((prev) => [...prev, { role: 'system', text: `✓ Applied ${count} change${count === 1 ? '' : 's'}.` }])
    }
    if (lastError) {
      showToast({ type: 'error', title: 'Some changes failed', message: lastError })
    }
  }

  const dismiss = (id) => setPendingTools((prev) => prev.filter((t) => t.id !== id))

  const reset = () => {
    setMessages([{ role: 'assistant', text: "Conversation cleared. What's next?" }])
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
    <div className="fixed inset-0 z-[65] flex justify-end animate-fade-in" role="dialog" aria-modal="true" aria-label="AI Assistant">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/[0.06] flex flex-col animate-slide-up sm:animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="icon-tile bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
              <Bot size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white">AI Assistant</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {apiKey ? 'gemini-2.0-flash' : 'No API key set'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost !p-1.5" onClick={reset} title="Clear conversation" aria-label="Clear conversation">
              <RotateCcw size={14} />
            </button>
            <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* No-key empty state */}
        {!apiKey && (
          <div className="m-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3">
            <div className="flex items-start gap-2">
              <Plug size={14} className="text-amber-700 dark:text-amber-300 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                Open <strong>Settings → Gemini AI</strong> and paste a key from{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline">aistudio.google.com/apikey</a> to enable the assistant.
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <Message key={i} message={m} />
          ))}

          {/* Pending tool calls */}
          {pendingTools.length > 0 && (
            <div className="rounded-xl border border-brand-300/60 dark:border-brand-500/30 bg-brand-50/60 dark:bg-brand-500/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                  <Sparkles size={11} /> Drafted changes
                </div>
                {pendingTools.length > 1 && (
                  <button className="text-[11px] font-bold text-brand-700 dark:text-brand-300 hover:underline" onClick={applyAll}>
                    Apply all ({pendingTools.length})
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {pendingTools.map((t) => (
                  <PendingToolCard key={t.id} tool={t} onApply={() => applyOne(t.id)} onDismiss={() => dismiss(t.id)} />
                ))}
              </ul>
            </div>
          )}

          {busy && (
            <div className="flex gap-1.5 items-center text-xs text-slate-400 dark:text-slate-500 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-soft-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-soft-pulse" style={{ animationDelay: '120ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-soft-pulse" style={{ animationDelay: '240ms' }} />
              Thinking…
            </div>
          )}
        </div>

        {/* Suggestion chips when empty-ish */}
        {messages.length <= 1 && !busy && (
          <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
            {[
              'Log 45 push-ups today',
              'Add cycle: 2 iPhone 16e ordered today',
              'What\'s my best run time?',
              'Add milestone: ASVAB practice test next Friday',
            ].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-white/[0.06] p-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Tell me what to log, or ask a question…"
              rows={1}
              className="input flex-1 resize-none min-h-[40px] max-h-[140px]"
            />
            <button
              className="btn-primary"
              onClick={() => sendMessage(input)}
              disabled={busy || !input.trim() || !apiKey}
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
            Drafts always need your approval before saving. ⏎ to send · Shift+⏎ for newline
          </p>
        </div>
      </div>
    </div>
  )
}

function Message({ message }) {
  if (message.role === 'system') {
    return (
      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
        {message.text}
      </div>
    )
  }
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className={`max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap break-words ${
        message.error
          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'
          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-100'
      }`}>
        {message.error && <AlertTriangle size={13} className="inline mr-1 -mt-0.5" />}
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
    <li className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left text-xs">
          <div className="font-semibold text-slate-900 dark:text-white">{summary}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
            {tool.name}
            <ChevronDown size={10} className={`transition ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={onDismiss} aria-label="Dismiss">
            <X size={13} />
          </button>
          <button className="btn-primary !py-1 !px-2 text-xs" onClick={onApply}>
            <Check size={12} /> Apply
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="mt-2 text-[10px] font-mono bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded p-2 overflow-x-auto text-slate-700 dark:text-slate-300">
          {JSON.stringify(tool.args, null, 2)}
        </pre>
      )}
    </li>
  )
}
