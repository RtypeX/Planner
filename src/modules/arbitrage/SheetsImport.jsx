import { useState } from 'react'
import { Sparkles, X, Check, AlertTriangle } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { DEFAULT_CARDCASH_RATE } from '../../lib/defaults'
import { todayISO, plusDaysISO } from '../../lib/calc'
import { generate, extractText, parseJsonish } from '../../lib/gemini'

const SYSTEM_PROMPT = `You parse spreadsheet data into iPhone arbitrage cycle objects. Return ONLY a JSON array (no markdown, no explanation). Each object must have exactly these fields:
- model (string, e.g. "iPhone 16e")
- quantity (number)
- costPerUnit (number, cost per phone)
- mobileXCost (number, per-unit fee, default 8)
- orderDate (string, YYYY-MM-DD)
- expectedDelivery (string, YYYY-MM-DD, default orderDate + 2 days)
- tradeInValue (number, gift card value per phone)
- cardCashRate (number, 0-1, default 0.77)
- status (string, one of: Ordered, Shipped, Traded, Submitted, Paid)
- actualPayout (number or empty string)
- notes (string or empty string)

Infer values from context. If a field is missing, use sensible defaults. Dates should be YYYY-MM-DD. Return [] if you cannot parse anything.`

async function callGemini(apiKey, pastedText, model) {
  const response = await generate({
    apiKey,
    model,
    systemInstruction: SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text: `Parse this spreadsheet data into cycles:\n\n${pastedText}` }] }],
    generationConfig: { temperature: 0.1 },
  })
  return parseJsonish(extractText(response))
}

export default function SheetsImport({ open, onClose }) {
  const { settings, setSettings, setCycles, showToast } = useAppData()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  const apiKey = settings.geminiApiKey || ''

  const handleParse = async () => {
    if (!apiKey) return setError('Add your Gemini API key in Settings first.')
    if (!text.trim()) return setError('Paste your spreadsheet data above.')
    setError('')
    setLoading(true)
    setPreview(null)
    try {
      const parsed = await callGemini(apiKey, text.trim(), settings.geminiModel)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError('Gemini could not parse any cycles from that data.')
        return
      }
      setPreview(parsed)
    } catch (e) {
      setError(e.message || 'Failed to parse')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = () => {
    if (!preview?.length) return
    const newCycles = preview.map((c) => ({
      id: uid(),
      model: c.model || 'iPhone 16e',
      quantity: Number(c.quantity) || 1,
      costPerUnit: Number(c.costPerUnit) || 0,
      mobileXCost: Number(c.mobileXCost) || 8,
      orderDate: c.orderDate || todayISO(),
      expectedDelivery: c.expectedDelivery || plusDaysISO(c.orderDate || todayISO(), 2),
      tradeInValue: Number(c.tradeInValue) || 0,
      cardCashRate: Number(c.cardCashRate) || DEFAULT_CARDCASH_RATE,
      status: c.status || 'Ordered',
      cardCashSubmittedDate: '',
      cardCashPaidDate: '',
      actualPayout: c.actualPayout || '',
      notes: c.notes || '',
      cardId: '',
      trackingNumber: '',
      carrier: '',
      trackingStatus: '',
      trackingCode: '',
      trackingLastUpdated: '',
      trackingRefreshedAt: '',
      actualDelivery: '',
    }))
    setCycles((prev) => [...newCycles, ...prev])
    showToast({ type: 'success', title: 'Imported', message: `${newCycles.length} cycle${newCycles.length > 1 ? 's' : ''} added.` })
    setText('')
    setPreview(null)
    onClose()
  }

  const handleClose = () => {
    setText('')
    setPreview(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} eyebrow="AI Import" title="Import from Sheets" size="lg">
      <div className="space-y-4">
        {/* API key inline if missing */}
        {!apiKey && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
            <p className="text-xs text-amber-400 mb-2 font-medium">Gemini API key required</p>
            <input
              type="password"
              placeholder="Paste your Gemini API key"
              className="input text-xs font-mono w-full"
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value.trim() })}
            />
            <p className="text-[11px] text-amber-300/80 mt-1">
              Get one free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline">aistudio.google.com/apikey</a>
            </p>
          </div>
        )}

        {/* Paste area */}
        <div>
          <label className="label">Paste spreadsheet data</label>
          <textarea
            className="input w-full font-mono text-xs min-h-[140px] resize-y"
            placeholder={"Copy rows from Google Sheets and paste here.\nE.g.: Model | Qty | Cost | Order Date | Trade-in | Status\niPhone 16e | 2 | 171 | 2026-05-20 | 310 | Ordered"}
            value={text}
            onChange={(e) => { setText(e.target.value); setPreview(null); setError('') }}
          />
        </div>

        {error && (
          <div className="text-xs text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Parse button */}
        {!preview && (
          <button className="btn-primary w-full justify-center" onClick={handleParse} disabled={loading}>
            <Sparkles size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Parsing with Gemini…' : 'Parse with AI'}
          </button>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--label-1)]">
              Preview ({preview.length} cycle{preview.length > 1 ? 's' : ''})
            </p>
            <div className="max-h-[200px] overflow-y-auto rounded-xl border border-[var(--glass-stroke)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--glass-bg-thin)] sticky top-0 backdrop-blur">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">Model</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Cost</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Date</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--separator-thin)]">
                  {preview.map((c, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">{c.model}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{c.quantity}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">${c.costPerUnit}</td>
                      <td className="px-2 py-1.5">{c.orderDate}</td>
                      <td className="px-2 py-1.5">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 justify-center" onClick={handleImport}>
                <Check size={15} /> Import {preview.length} cycle{preview.length > 1 ? 's' : ''}
              </button>
              <button className="btn-secondary" onClick={() => { setPreview(null); setError('') }}>
                <X size={15} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
