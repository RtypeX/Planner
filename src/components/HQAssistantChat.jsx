import { useEffect, useMemo, useRef, useState, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip, SendIcon, XIcon, LoaderIcon, Sparkles, Command,
  Plus, Dumbbell, Flag, BookOpen, Wallet, Check, ChevronDown, AlertTriangle,
  RotateCcw, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppData } from '@/lib/AppData'
import { generate, extractFunctionCalls, extractText } from '@/lib/gemini'
import { AI_TOOL_BY_NAME, buildGeminiTools, summarizeState } from '@/lib/aiTools'

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

/**
 * Auto-resize textarea hook.
 * Mirrors the one in animated-ai-chat.tsx so behavior is identical.
 */
function useAutoResize(minHeight, maxHeight) {
  const ref = useRef(null)
  const adjust = useCallback((reset) => {
    const el = ref.current
    if (!el) return
    if (reset) { el.style.height = `${minHeight}px`; return }
    el.style.height = `${minHeight}px`
    const next = Math.max(minHeight, Math.min(el.scrollHeight, maxHeight ?? Infinity))
    el.style.height = `${next}px`
  }, [minHeight, maxHeight])
  useEffect(() => {
    if (ref.current) ref.current.style.height = `${minHeight}px`
  }, [minHeight])
  useEffect(() => {
    const onResize = () => adjust()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [adjust])
  return [ref, adjust]
}

const COMMANDS = [
  { icon: Plus,      label: 'New cycle',     description: 'Add an iPhone arbitrage cycle', prefix: '/cycle' },
  { icon: Dumbbell,  label: 'Log workout',   description: 'Add a fitness session',         prefix: '/workout' },
  { icon: Flag,      label: 'New milestone', description: 'Add a date to the timeline',    prefix: '/milestone' },
  { icon: BookOpen,  label: 'Study session', description: 'Log ASVAB study time',          prefix: '/study' },
  { icon: Wallet,    label: 'Update balance', description: 'Set liquid cash or savings',   prefix: '/balance' },
]

const COMMAND_BY_PREFIX = Object.fromEntries(COMMANDS.map((c) => [c.prefix, c]))

/**
 * The real HQ Assistant chat — fuses the AnimatedAIChat aesthetic with
 * our Gemini + tool-calling backend.
 */
export default function HQAssistantChat({ onClose }) {
  const app = useAppData()
  const { settings, showToast } = app
  const apiKey = settings.geminiApiKey || ''

  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()
  const [showCommands, setShowCommands] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [messages, setMessages] = useState([])
  const [pendingTools, setPendingTools] = useState([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [inputFocused, setInputFocused] = useState(false)

  const [textareaRef, adjustHeight] = useAutoResize(60, 200)
  const commandPaletteRef = useRef(null)
  const messagesScrollRef = useRef(null)

  // Build a state snapshot for the model
  const stateSnapshot = useMemo(
    () => summarizeState(app),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app.cycles, app.workouts, app.milestones, app.balance, app.asvab, app.phoneModels],
  )

  // Show command palette when typing /
  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommands(true)
      const idx = COMMANDS.findIndex((cmd) => cmd.prefix.startsWith(value))
      setActiveSuggestion(idx)
    } else {
      setShowCommands(false)
    }
  }, [value])

  // Mousemove for the ambient orb
  useEffect(() => {
    const onMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Click-outside the command palette
  useEffect(() => {
    const onClick = (e) => {
      const cmdBtn = document.querySelector('[data-command-button]')
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(e.target) &&
        !cmdBtn?.contains(e.target)
      ) {
        setShowCommands(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight
    }
  }, [messages, pendingTools, busy])

  const selectCommand = (idx) => {
    const cmd = COMMANDS[idx]
    if (!cmd) return
    setValue(cmd.prefix + ' ')
    setShowCommands(false)
    setTimeout(() => textareaRef.current?.focus(), 30)
  }

  const handleKeyDown = (e) => {
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion((p) => (p < COMMANDS.length - 1 ? p + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion((p) => (p > 0 ? p - 1 : COMMANDS.length - 1))
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        if (activeSuggestion >= 0) selectCommand(activeSuggestion)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowCommands(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) sendMessage()
    }
  }

  const sendMessage = async () => {
    if (!value.trim() || busy) return
    if (!apiKey) {
      showToast({ type: 'error', title: 'No API key', message: 'Add a Gemini key in Settings.' })
      return
    }

    const text = value.trim()
    const userMsg = { role: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setValue('')
    adjustHeight(true)

    startTransition(() => setBusy(true))

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
      const replyText = extractText(response)
      const validatedCalls = calls
        .filter((c) => AI_TOOL_BY_NAME[c.name])
        .map((c) => ({ ...c, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }))

      const assistantMsg = {
        role: 'assistant',
        text: replyText || (validatedCalls.length
          ? `drafted ${validatedCalls.length} ${validatedCalls.length === 1 ? 'change' : 'changes'} below.`
          : '…'),
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
    setMessages([])
    setPendingTools([])
    setValue('')
    adjustHeight(true)
  }

  const hasConversation = messages.length > 0 || pendingTools.length > 0 || busy

  return (
    <div className="min-h-full flex flex-col w-full items-center justify-start text-white p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative flex-1 flex flex-col">
        <motion.div
          className="relative z-10 space-y-8 flex-1 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Hero — only show before first message */}
          {!hasConversation && (
            <div className="text-center space-y-3 mt-8 sm:mt-16">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
              >
                <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                  How can I help today?
                </h1>
                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.div>
              <motion.p
                className="text-sm text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Type a command or ask a question
              </motion.p>
            </div>
          )}

          {/* Messages */}
          {hasConversation && (
            <div
              ref={messagesScrollRef}
              className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[55vh] min-h-[200px]"
            >
              {messages.map((m, i) => <Message key={i} message={m} />)}

              {pendingTools.length > 0 && (
                <PendingPanel tools={pendingTools} onApplyOne={applyOne} onApplyAll={applyAll} onDismiss={dismiss} />
              )}

              {busy && <ThinkingDots />}
            </div>
          )}

          {/* Composer */}
          <motion.div
            className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence>
              {showCommands && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-1 bg-black/95">
                    {COMMANDS.map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <motion.div
                          key={suggestion.prefix}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer',
                            activeSuggestion === index ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5',
                          )}
                          onClick={() => selectCommand(index)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center text-white/60">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-white/40 text-xs ml-1">{suggestion.prefix}</div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  adjustHeight()
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Tell me what to log, or ask a question…"
                className={cn(
                  'w-full px-4 py-3 resize-none bg-transparent border-none',
                  'text-white/90 text-sm focus:outline-none',
                  'placeholder:text-white/20 min-h-[60px]',
                )}
                style={{ overflow: 'hidden' }}
              />
            </div>

            <div className="p-4 border-t border-white/[0.05] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  data-command-button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCommands((p) => !p)
                  }}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    'p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group',
                    showCommands && 'bg-white/10 text-white/90',
                  )}
                  aria-label="Commands"
                >
                  <Command className="w-4 h-4" />
                  <motion.span
                    className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    layoutId="hq-button-highlight"
                  />
                </motion.button>
                {hasConversation && (
                  <motion.button
                    type="button"
                    onClick={reset}
                    whileTap={{ scale: 0.94 }}
                    className="p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors"
                    aria-label="Clear conversation"
                    title="Clear conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!apiKey && (
                  <span className="text-[11px] text-amber-300/80 mr-1">
                    Add Gemini key in Settings
                  </span>
                )}
                <motion.button
                  type="button"
                  onClick={sendMessage}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={busy || !value.trim() || !apiKey}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    value.trim() && apiKey
                      ? 'bg-white text-[#0A0A0B] shadow-lg shadow-white/10'
                      : 'bg-white/[0.05] text-white/40',
                  )}
                >
                  {busy
                    ? <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                    : <SendIcon className="w-4 h-4" />}
                  <span>Send</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Suggestion chips — only when no conversation yet */}
          {!hasConversation && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {COMMANDS.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <motion.button
                    key={suggestion.prefix}
                    onClick={() => selectCommand(index)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-sm text-white/60 hover:text-white/90 transition-all relative group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{suggestion.label}</span>
                    <motion.div
                      className="absolute inset-0 border border-white/[0.05] rounded-lg"
                      initial={false}
                      animate={{ opacity: [0, 1], scale: [0.98, 1] }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mouse-tracking ambient orb */}
      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.04] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          animate={{ x: mousePosition.x - 400, y: mousePosition.y - 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 150, mass: 0.5 }}
        />
      )}
    </div>
  )
}

function Message({ message }) {
  if (message.role === 'system') {
    return (
      <div className="flex items-center gap-2 text-[12px] text-emerald-400 px-1">
        <Check size={12} strokeWidth={2} />
        <span>{message.text}</span>
      </div>
    )
  }
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] text-white px-3.5 py-2.5 rounded-2xl rounded-br-md text-[14px] whitespace-pre-wrap break-words"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.45), rgba(99,102,241,0.40))' }}
        >
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start gap-2">
      <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={12} className="text-white/70" />
      </div>
      <div
        className={cn(
          'max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-[14px] whitespace-pre-wrap break-words backdrop-blur-md',
          message.error
            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            : 'bg-white/[0.04] text-white/90 border border-white/[0.06]',
        )}
      >
        {message.error && <AlertTriangle size={12} strokeWidth={1.8} className="inline mr-1.5 -mt-0.5" />}
        {message.text}
      </div>
    </div>
  )
}

function PendingPanel({ tools, onApplyOne, onApplyAll, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-3 space-y-2 border border-violet-500/30"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(99,102,241,0.06))',
        backdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-200">
          <Sparkles size={11} strokeWidth={2} className="animate-pulse" /> Drafted changes
        </div>
        {tools.length > 1 && (
          <button
            className="text-[11px] font-semibold text-violet-200 hover:text-white"
            onClick={onApplyAll}
          >
            Apply all ({tools.length})
          </button>
        )}
      </div>
      <ul className="space-y-1.5">
        {tools.map((t) => (
          <PendingToolCard key={t.id} tool={t} onApply={() => onApplyOne(t.id)} onDismiss={() => onDismiss(t.id)} />
        ))}
      </ul>
    </motion.div>
  )
}

function PendingToolCard({ tool, onApply, onDismiss }) {
  const [expanded, setExpanded] = useState(false)
  const meta = AI_TOOL_BY_NAME[tool.name]
  const summary = meta?.summarize?.(tool.args) || tool.name
  return (
    <li className="rounded-xl p-2.5 bg-black/40 border border-white/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left">
          <div className="text-[13px] font-medium text-white/90">{summary}</div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-white/40 mt-1 flex items-center gap-1">
            {tool.name}
            <ChevronDown size={10} className={`transition ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-1.5 text-white/40 hover:text-rose-400 rounded-md transition-colors"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <XIcon size={12} />
          </button>
          <button
            className="px-2.5 py-1 rounded-md bg-white text-black text-xs font-semibold flex items-center gap-1 hover:bg-white/90 transition"
            onClick={onApply}
          >
            <Check size={11} strokeWidth={2.4} /> Apply
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="mt-2 text-[10px] font-mono p-2 rounded-lg overflow-x-auto bg-black/40 border border-white/[0.06] text-white/60">
          {JSON.stringify(tool.args, null, 2)}
        </pre>
      )}
    </li>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 text-sm text-white/70 px-1">
      <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
        <Bot size={12} className="text-white/70" />
      </div>
      <span>Thinking</span>
      <div className="flex items-center ml-1">
        {[1, 2, 3].map((dot) => (
          <motion.div
            key={dot}
            className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)' }}
          />
        ))}
      </div>
    </div>
  )
}
