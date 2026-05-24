import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, RefreshCw, Truck } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { CYCLE_STATUSES, PHONE_MODELS, DEFAULT_CARDCASH_RATE } from '../../lib/defaults'
import { fmtCurrency, expectedPayout, plusDaysISO, todayISO, totalCost, netProfit } from '../../lib/calc'
import { useAppData } from '../../lib/AppData'
import { CARRIERS, detectCarrier, trackingUrl } from '../../lib/tracking'

const empty = () => ({
  id: '',
  model: 'iPhone 16e',
  quantity: 1,
  costPerUnit: PHONE_MODELS['iPhone 16e'].cost,
  mobileXCost: PHONE_MODELS['iPhone 16e'].mobileX,
  orderDate: todayISO(),
  expectedDelivery: plusDaysISO(todayISO(), 2),
  tradeInValue: PHONE_MODELS['iPhone 16e'].tradeIn,
  cardCashRate: DEFAULT_CARDCASH_RATE,
  status: 'Ordered',
  cardCashSubmittedDate: '',
  cardCashPaidDate: '',
  actualPayout: '',
  notes: '',
  cardId: '',
  trackingNumber: '',
  carrier: '',
  trackingStatus: '',
  trackingCode: '',
  trackingLastUpdated: '',
  trackingRefreshedAt: '',
  actualDelivery: '',
})

export default function CycleForm({ open, onClose, onSave, initial }) {
  const { privacyCards, settings, refreshTracking, showToast, cycles } = useAppData()
  const [form, setForm] = useState(empty())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (open) setForm(initial ? { ...empty(), ...initial } : empty())
  }, [open, initial])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const onModelChange = (model) => {
    const m = PHONE_MODELS[model]
    if (!m) return update({ model })
    update({
      model,
      costPerUnit: m.cost,
      mobileXCost: m.mobileX,
      tradeInValue: m.tradeIn,
    })
  }

  const onOrderDateChange = (d) => {
    update({ orderDate: d, expectedDelivery: plusDaysISO(d, 2) })
  }

  const onTrackingChange = (val) => {
    const trimmed = (val || '').trim()
    update({
      trackingNumber: trimmed,
      // Auto-fill carrier when user hasn't picked one yet
      carrier: form.carrier || (trimmed ? detectCarrier(trimmed) : ''),
    })
  }

  const handleRefresh = async () => {
    if (!form.id) {
      showToast({ type: 'info', message: 'Save the cycle first, then refresh tracking.' })
      return
    }
    if (!form.trackingNumber) {
      showToast({ type: 'info', message: 'Add a tracking number first.' })
      return
    }
    if (!settings.trackingProxyUrl) {
      showToast({
        type: 'error',
        title: 'Tracking API not configured',
        message: 'Open Settings → Tracking API and paste your proxy URL.',
      })
      return
    }
    setRefreshing(true)
    try {
      const { cycle } = await refreshTracking(form.id)
      // Sync the latest values into the open form
      setForm((f) => ({ ...f, ...cycle }))
      showToast({
        type: 'success',
        title: 'Tracking refreshed',
        message: cycle.trackingStatus || 'Updated',
      })
    } catch (err) {
      showToast({ type: 'error', title: 'Tracking failed', message: err.message })
    } finally {
      setRefreshing(false)
    }
  }

  const calc = useMemo(() => ({
    expected: expectedPayout(form),
    cost: totalCost(form),
    net: netProfit(form),
  }), [form])

  const handleSave = () => {
    onSave(form)
    onClose()
  }

  const externalUrl = trackingUrl(form.trackingNumber, form.carrier || detectCarrier(form.trackingNumber))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit cycle' : 'New cycle'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save cycle</button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Phone model</label>
          <select className="input" value={form.model} onChange={(e) => onModelChange(e.target.value)}>
            {Object.keys(PHONE_MODELS).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input
            type="number"
            min={1}
            className="input"
            value={form.quantity}
            onChange={(e) => update({ quantity: Math.max(1, parseInt(e.target.value || '0', 10)) })}
          />
        </div>

        <div>
          <label className="label">Cost per unit</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.costPerUnit}
            onChange={(e) => update({ costPerUnit: parseFloat(e.target.value || '0') })}
          />
        </div>
        <div>
          <label className="label">MobileX cost / unit</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.mobileXCost}
            onChange={(e) => update({ mobileXCost: parseFloat(e.target.value || '0') })}
          />
        </div>

        <div>
          <label className="label">Order date</label>
          <input
            type="date"
            className="input"
            value={form.orderDate}
            onChange={(e) => onOrderDateChange(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Expected delivery</label>
          <input
            type="date"
            className="input"
            value={form.expectedDelivery}
            onChange={(e) => update({ expectedDelivery: e.target.value })}
          />
        </div>

        {/* Tracking section */}
        <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-brand-600 dark:text-brand-400" />
            <h4 className="font-semibold text-sm">Shipment tracking</h4>
            {form.trackingStatus && (
              <span className="badge bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ml-auto">
                {form.trackingStatus}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Tracking number</label>
              <input
                className="input font-mono text-sm"
                value={form.trackingNumber}
                placeholder="1Z999AA10123456784"
                onChange={(e) => onTrackingChange(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Carrier</label>
              <select
                className="input"
                value={form.carrier || ''}
                onChange={(e) => update({ carrier: e.target.value })}
              >
                <option value="">{form.trackingNumber ? `auto (${detectCarrier(form.trackingNumber)})` : 'auto'}</option>
                {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Actual delivery</label>
              <input
                type="date"
                className="input"
                value={form.actualDelivery || ''}
                onChange={(e) => update({ actualDelivery: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex items-end gap-2">
              <a
                href={externalUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className={`btn-secondary flex-1 justify-center ${!externalUrl && 'pointer-events-none opacity-50'}`}
              >
                <ExternalLink size={15} /> Track on {form.carrier || 'UPS'}
              </a>
              <button
                type="button"
                className="btn-secondary flex-1 justify-center"
                onClick={handleRefresh}
                disabled={refreshing || !form.trackingNumber}
                title={settings.trackingProxyUrl ? 'Fetch live status from your proxy' : 'Configure proxy URL in Settings to enable'}
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh status'}
              </button>
            </div>
          </div>
          {form.trackingRefreshedAt && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Last refreshed {new Date(form.trackingRefreshedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div>
          <label className="label">Trade-in value / unit</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.tradeInValue}
            onChange={(e) => update({ tradeInValue: parseFloat(e.target.value || '0') })}
          />
        </div>
        <div>
          <label className="label">CardCash rate</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="input pr-12"
              value={form.cardCashRate}
              onChange={(e) => update({ cardCashRate: parseFloat(e.target.value || '0') })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
              {(Number(form.cardCashRate) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => update({ status: e.target.value })}>
            {CYCLE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Privacy card (optional)</label>
          <select className="input" value={form.cardId || ''} onChange={(e) => update({ cardId: e.target.value })}>
            <option value="">— none —</option>
            {privacyCards.map((c) => (
              <option key={c.id} value={c.id}>{c.nickname}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">CardCash submitted date</label>
          <input
            type="date"
            className="input"
            value={form.cardCashSubmittedDate || ''}
            onChange={(e) => update({ cardCashSubmittedDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">CardCash paid date</label>
          <input
            type="date"
            className="input"
            value={form.cardCashPaidDate || ''}
            onChange={(e) => update({ cardCashPaidDate: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Actual payout received (leave blank to use expected)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.actualPayout}
            placeholder={`Expected ${fmtCurrency(calc.expected)}`}
            onChange={(e) => update({ actualPayout: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[72px]"
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <CalcTile label="Total cost" value={fmtCurrency(calc.cost)} />
        <CalcTile label="Expected payout" value={fmtCurrency(calc.expected)} />
        <CalcTile
          label="Projected net"
          value={fmtCurrency(calc.net)}
          color={calc.net >= 0 ? 'emerald' : 'rose'}
        />
      </div>
    </Modal>
  )
}

function CalcTile({ label, value, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  }
  return (
    <div className={`rounded-lg p-3 ${colors[color] || colors.slate}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  )
}
