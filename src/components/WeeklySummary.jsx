import { useState } from 'react'
import { Sparkles, RefreshCw, Bot } from 'lucide-react'
import { useAppData } from '../lib/AppData'
import { generate, extractText } from '../lib/gemini'
import { summarizeState } from '../lib/aiTools'

const PROMPT = `Write a 3-sentence weekly recap for Dylan's planner. Tone: a friend texting, not a corporate newsletter.

Hard rules:
- Plain sentences, no bullets, no headers.
- No openers like "This week,", "Here's your recap,", "Great progress!". Just start with the most interesting fact.
- Drop fluff words: "really", "amazing", "incredible", "journey", "keep up the great work".
- Include one specific number. Don't pad with vague encouragement.
- If the week was quiet, say it was quiet. Don't manufacture wins.
- Lowercase casual is fine. Contractions are fine.

What to cover (pick the 2-3 that actually matter for this week):
cycles paid this week, pending payouts waiting, workout count vs last week, biggest fitness PR, milestones in next ~10 days, PC-goal progress.`

/**
 * AI-generated weekly digest card on the home page. Caches the most recent
 * summary in memory only; doesn't auto-call to avoid silent API spend. The
 * user clicks Generate.
 */
export default function WeeklySummary({ onOpenAssistant }) {
  const app = useAppData()
  const apiKey = app.settings.geminiApiKey || ''
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    if (!apiKey) {
      setError('Add a Gemini API key in Settings to enable summaries.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const snapshot = summarizeState(app)
      const response = await generate({
        apiKey,
        model: app.settings.geminiModel,
        systemInstruction: PROMPT,
        contents: [
          {
            role: 'user',
            parts: [{ text: `Current state JSON:\n${JSON.stringify(snapshot, null, 2)}\n\nGive me this week's recap.` }],
          },
        ],
        generationConfig: { temperature: 0.65 },
      })
      setText(extractText(response) || 'No content returned.')
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card-padded">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <div className="icon-tile bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="section-title">Weekly digest</h3>
            <p className="section-sub">AI-generated summary of your week</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpenAssistant && (
            <button className="btn-ghost text-xs" onClick={onOpenAssistant}>
              <Bot size={13} /> Open assistant
            </button>
          )}
          <button className="btn-secondary text-xs !py-1.5" onClick={run} disabled={loading || !apiKey}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {text ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>
      {!apiKey && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No Gemini key set. Open Settings to enable summaries and the AI assistant.
        </p>
      )}
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
      {text && (
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</p>
      )}
      {!text && !error && apiKey && !loading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click Generate for a quick recap. Each summary uses a small amount of Gemini quota.
        </p>
      )}
    </section>
  )
}
