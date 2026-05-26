import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, RefreshCw, Truck, Smartphone, Receipt, ArrowRightLeft, FileText } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { CYCLE_STATUSES, DEFAULT_CARDCASH_RATE, findModel } from '../../lib/defaults'
import { fmtCurrency, expectedPayout, plusDaysISO, todayISO, totalCost, netProfit } from '../../lib/calc'
import { useAppData } from '../../lib/AppData'
import { CARRIERS, detectCarrier, trackingUrl } from '../../lib/tracking'

const empty = (firstModel) => ({
  id: '',
  model: firstModel?.name || 'iPhone 16e',
  quantity: 1,
  costPerUnit: firstModel?.cost ?? 171,
  mobileXCost: firstModel?.mobileX ?? 8,
  orderDate: todayISO(),
  expectedDelivery: plusDaysISO(todayISO(), 2),
  tradeInValue: firstModel?.tradeIn ?? 310,
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
  const { privacyCards, settings, refreshTracking, showToast, phoneModels } = useAppData()
  const firstModel = phoneModels[0]
  const [form, setForm] = useState(() => empty(firstModel))
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (open) setForm(initial ? { ...empty(firstModel), ...initial } : empty(firstModel))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const onModelChange = (name) => {
    const m = findModel(phoneModels, name)
    if (!m) return update({ model: name })
    update({
      model: m.name,
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

  // Inline validation — keep this simple and field-level.
  const errors = useMemo(() => {
    const e = {}
    if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 1) e.quantity = 'Must be at least 1'
    if (Number(form.costPerUnit) < 0) e.costPerUnit = 'Cannot be negative'
    if (Number(form.mobileXCost) < 0) e.mobileXCost = 'Cannot be negative'
    if (Number(form.tradeInValue) < 0) e.tradeInValue = 'Cannot be negative'
    if (Number(form.cardCashRate) < 0 || Number(form.cardCashRate) > 1) e.cardCashRate = 'Must be 0–1'
    if (form.actualPayout !== '' && Number(form.actualPayout) < 0) e.actualPayout = 'Cannot be negative'
    return e
  }, [form])

  const hasErrors = Object.keys(errors).length > 0

  const handleSave = () => {
    if (hasErrors) {
      showToast({ type: 'error', title: 'Fix errors first', message: Object.values(errors)[0] })
      return
    }
    onSave(form)
    onClose()
  }

  const externalUrl = trackingUrl(form.trackingNumber, form.carrier || detectCarrier(form.trackingNumber))

  // Show stored model name even if it's no longer in the user's list.
  const modelOptions = useMemo(() => {
    const names = new Set(phoneModels.map((m) => m.name))
    if (form.model && !names.has(form.model)) {
      return [...phoneModels, { id: 'orphan', name: form.model }]
    }
    return phoneModels
  }, [phoneModels, form.model])

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={initial?.id ? 'Edit cycle' : 'New cycle'}
      title={initial?.id ? `${form.model} × ${form.quantity}` : 'New arbitrage cycle'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={hasErrors}>Save cycle</button>
        </>
      }
    >
      {/* ── Section: Item ─────────────────────────── */}
      <FormSection icon={Smartphone} title="Item">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone model</label>
            <select className="input" value={form.model} onChange={(e) => onModelChange(e.target.value)}>
              {modelOptions.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Manage models in Settings → Phone models.
            </p>
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
        </div>
      </FormSection>

      {/* ── Section: Shipping ─────────────────────── */}
      <FormSection icon={Truck} title="Shipping & tracking">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="">{form.trackingNumber ? `auto · ${detectCarrier(form.trackingNumber)}` : 'auto'}</option>
                {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {form.trackingNumber && (
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={externalUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className={`btn-secondary justify-center ${!externalUrl && 'pointer-events-none opacity-50'}`}
              >
                <ExternalLink size={15} /> Track on {form.carrier || detectCarrier(form.trackingNumber) || 'UPS'}
              </a>
              <button
                type="button"
                className="btn-secondary justify-center"
                onClick={handleRefresh}
                disabled={refreshing || !form.trackingNumber}
                title={settings.trackingProxyUrl ? 'Fetch live status from your proxy' : 'Configure proxy URL in Settings to enable'}
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh status'}
              </button>
            </div>
          )}
          <div>
            <label className="label">Actual delivery</label>
            <input
              type="date"
              className="input"
              value={form.actualDelivery || ''}
              onChange={(e) => update({ actualDelivery: e.target.value })}
            />
          </div>
          {form.trackingStatus && (
            <div className="glass-tile px-3 py-2">
              <div className="label !mb-0.5">Live status</div>
              <div className="font-semibold text-sm text-[var(--label-1)]">{form.trackingStatus}</div>
              {form.trackingRefreshedAt && (
                <div className="text-[11px] text-[var(--label-3)]">
                  Refreshed {new Date(form.trackingRefreshedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </FormSection>

      {/* ── Section: Trade & payout ───────────────── */}
      <FormSection icon={ArrowRightLeft} title="Trade & payout">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {(Number(form.cardCashRate) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => update({ status: e.target.value })}>
              {CYCLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Privacy card</label>
            <select className="input" value={form.cardId || ''} onChange={(e) => update({ cardId: e.target.value })}>
              <option value="">— none —</option>
              {privacyCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname}{c.last4 ? ` ····${c.last4}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">CardCash submitted</label>
            <input
              type="date"
              className="input"
              value={form.cardCashSubmittedDate || ''}
              onChange={(e) => update({ cardCashSubmittedDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">CardCash paid</label>
            <input
              type="date"
              className="input"
              value={form.cardCashPaidDate || ''}
              onChange={(e) => update({ cardCashPaidDate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Actual payout received</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.actualPayout}
              placeholder={`Leave blank for expected ${fmtCurrency(calc.expected)}`}
              onChange={(e) => update({ actualPayout: e.target.value })}
            />
          </div>
        </div>
      </FormSection>

      {/* ── Section: Notes ────────────────────────── */}
      <FormSection icon={FileText} title="Notes">
        <textarea
          className="input min-h-[80px]"
          value={form.notes}
          placeholder="Anything worth remembering about this cycle…"
          onChange={(e) => update({ notes: e.target.value })}
        />
      </FormSection>

      {/* ── Live calculation summary ──────────────── */}
      <div className="mt-6 glass-tile p-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={14} className="text-[var(--label-3)]" />
          <h4 className="text-[11px] uppercase tracking-wider font-bold text-[var(--label-2)]">
            Summary
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <CalcTile label="Total cost" value={fmtCurrency(calc.cost)} />
          <CalcTile label="Expected" value={fmtCurrency(calc.expected)} />
          <CalcTile
            label="Projected net"
            value={fmtCurrency(calc.net)}
            tone={calc.net >= 0 ? 'emerald' : 'rose'}
          />
        </div>
      </div>
    </Modal>
  )
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={14} className="text-[var(--tint)]" />}
        <h4 className="text-[11px] uppercase tracking-wider font-bold text-[var(--label-2)]">
          {title}
        </h4>
        <div className="flex-1 h-px bg-[var(--separator)]" />
      </div>
      {children}
    </section>
  )
}

function CalcTile({ label, value, tone = 'slate' }) {
  const tones = {
    slate:   { bg: 'rgba(255,255,255,0.04)', text: 'var(--label-1)',  ring: 'var(--glass-stroke)' },
    emerald: { bg: 'rgba(48,209,88,0.12)',   text: '#30d158',         ring: 'rgba(48,209,88,0.30)' },
    rose:    { bg: 'rgba(255,69,58,0.12)',   text: '#ff453a',         ring: 'rgba(255,69,58,0.30)' },
  }
  const t = tones[tone] || tones.slate
  return (
    <div
      className="rounded-xl p-2.5"
      style={{
        background: t.bg,
        boxShadow: `inset 0 0 0 1px ${t.ring}`,
        color: t.text,
      }}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</div>
      <div className="font-bold tabular-nums mt-0.5 text-base">{value}</div>
    </div>
  )
}
