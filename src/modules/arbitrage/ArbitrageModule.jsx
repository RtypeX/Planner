import { useEffect, useState } from 'react'
import {
  Plus, DollarSign, Wallet, Clock, TrendingUp, Target,
  RefreshCw, Truck, Sparkles, Zap, FileSpreadsheet,
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import CycleForm from './CycleForm'
import CycleList from './CycleTable'
import PrivacyCards from './PrivacyCards'
import Projector from './Projector'
import SheetsImport from './SheetsImport'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { PC_GOAL } from '../../lib/defaults'
import { useCountUp } from '../../lib/animation'
import {
  fmtCurrency,
  operatingCapital,
  pendingCardCash,
  totalAllTimeProfit,
  cyclesCompleted,
} from '../../lib/calc'

export default function ArbitrageModule() {
  const {
    cycles, setCycles, balance, setBalance, privacyCards, settings, refreshAllTracking,
    undoableDelete, showToast,
  } = useAppData()
  const [editing, setEditing] = useState(null)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [sheetsOpen, setSheetsOpen] = useState(false)

  const op = operatingCapital(cycles)
  const pending = pendingCardCash(cycles)
  const profit = totalAllTimeProfit(cycles)
  const completed = cyclesCompleted(cycles)
  const liquid = Number(balance.liquidCash || 0)
  const trackedCount = cycles.filter((c) => c.trackingNumber && c.status !== 'Paid').length
  const proxyConfigured = !!settings.trackingProxyUrl
  const pcPct = Math.max(0, Math.min(100, (profit / PC_GOAL) * 100))
  const pcRemaining = Math.max(0, PC_GOAL - profit)

  // Animated counters
  const profitAnim = useCountUp(Math.max(0, profit), { duration: 1100 })
  const completedAnim = useCountUp(completed, { duration: 700 })
  const trackedAnim = useCountUp(trackedCount, { duration: 600 })
  const totalCyclesAnim = useCountUp(cycles.length, { duration: 600 })

  const saveCycle = (cycle) => {
    if (cycle.id) setCycles((prev) => prev.map((c) => (c.id === cycle.id ? cycle : c)))
    else setCycles((prev) => [{ ...cycle, id: uid() }, ...prev])
  }
  const deleteCycle = (cycle) => {
    undoableDelete({
      label: `${cycle.model} × ${cycle.quantity}`,
      perform: () => setCycles((prev) => prev.filter((c) => c.id !== cycle.id)),
      restore: () => setCycles((prev) => [cycle, ...prev]),
    })
  }

  /** Bulk-update status across many cycles at once. */
  const bulkSetStatus = (ids, status) => {
    if (!ids?.length) return
    setCycles((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, status } : c)))
    showToast({ type: 'success', title: 'Updated', message: `Set ${ids.length} cycle${ids.length === 1 ? '' : 's'} to ${status}.` })
  }

  /** Bulk-delete with undo. Stash the records in case of restore. */
  const bulkDelete = (ids) => {
    if (!ids?.length) return
    const removed = cycles.filter((c) => ids.includes(c.id))
    undoableDelete({
      label: `${removed.length} cycle${removed.length === 1 ? '' : 's'}`,
      perform: () => setCycles((prev) => prev.filter((c) => !ids.includes(c.id))),
      restore: () => setCycles((prev) => [...removed, ...prev]),
    })
  }

  /** Inline status change from the cycle card chip. */
  const setStatus = (id, status) => {
    setCycles((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  /**
   * Duplicate a cycle: copy item / cost / payout settings into a fresh draft,
   * but reset dates, status, tracking, and CardCash submission so the user
   * has a clean slate for a new order.
   */
  const duplicateCycle = (cycle) => {
    const today = (new Date()).toISOString().slice(0, 10)
    const todayPlus2 = new Date(); todayPlus2.setDate(todayPlus2.getDate() + 2)
    setEditing({
      // copy form-relevant fields
      model: cycle.model,
      quantity: cycle.quantity,
      costPerUnit: cycle.costPerUnit,
      mobileXCost: cycle.mobileXCost,
      tradeInValue: cycle.tradeInValue,
      cardCashRate: cycle.cardCashRate,
      cardId: cycle.cardId || '',
      // reset everything date/status/tracking related
      orderDate: today,
      expectedDelivery: todayPlus2.toISOString().slice(0, 10),
      status: 'Ordered',
      cardCashSubmittedDate: '',
      cardCashPaidDate: '',
      actualPayout: '',
      actualDelivery: '',
      trackingNumber: '',
      carrier: '',
      trackingStatus: '',
      trackingCode: '',
      trackingLastUpdated: '',
      trackingRefreshedAt: '',
      // notes carry over with a marker
      notes: cycle.notes ? `(Duplicated) ${cycle.notes}` : '',
      // no id — saving creates a new cycle
    })
  }

  const handleRefreshAll = async () => {
    setRefreshingAll(true)
    try { await refreshAllTracking() } finally { setRefreshingAll(false) }
  }

  // Listen for command-palette "New cycle" actions
  useEffect(() => {
    const onNew = () => setEditing({})
    window.addEventListener('hq:new-cycle', onNew)
    return () => window.removeEventListener('hq:new-cycle', onNew)
  }, [])

  return (
    <div className="space-y-10">
      {/* ───────── Page header ───────── */}
      <header className="animate-slide-down">
        <div className="page-eyebrow"><TrendingUp size={11} strokeWidth={1.6} /> Arbitrage</div>
        <h1 className="page-title">Cycle command</h1>
        <p className="page-subtitle">iPhone flips · MobileX trade-in · CardCash payouts</p>

        <div className="flex items-center gap-2 flex-wrap mt-6">
          {trackedCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleRefreshAll}
              disabled={refreshingAll}
              title={proxyConfigured ? `Refresh ${trackedCount} active shipments` : 'Configure proxy URL in Settings'}
            >
              <RefreshCw size={13} strokeWidth={1.6} className={refreshingAll ? 'animate-spin' : ''} />
              {refreshingAll ? 'Refreshing…' : `Refresh tracking (${trackedCount})`}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setSheetsOpen(true)}>
            <FileSpreadsheet size={13} strokeWidth={1.6} /> Import
          </button>
          <LiquidButton size="sm" onClick={() => setEditing({})} className="!h-9 !px-5 text-[14px] font-semibold">
            <Plus size={14} strokeWidth={2.2} /> New cycle
          </LiquidButton>
        </div>
      </header>

      {/* ───────── Lede: PC goal as editorial number ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6">
        <div className="lg:col-span-7 lede">
          <div className="stat-label">PC goal · all-time profit</div>
          <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
               style={{ fontWeight: 500, fontSize: 'clamp(56px, 48px + 2.5vw, 96px)', letterSpacing: '-0.04em' }}>
            {fmtCurrency(profitAnim)}
          </div>
          <div className="text-[var(--ink-3)] mt-3">
            of {fmtCurrency(PC_GOAL)} target
            {profit < PC_GOAL && <> · {fmtCurrency(pcRemaining)} to go</>}
          </div>
          <div className="mt-5">
            <ProgressBar
              value={Math.max(0, profit)}
              max={PC_GOAL}
              color={profit >= PC_GOAL ? 'sage' : 'accent'}
              showPct
              size="lg"
            />
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-3 gap-px bg-[var(--rule)] border border-[var(--rule)] self-end">
          <CycleStatCell label="Cycles" value={completedAnim} />
          <CycleStatCell label="In transit" value={trackedAnim} pulse={trackedCount > 0} />
          <CycleStatCell label="Logged" value={totalCyclesAnim} />
        </div>
      </section>

      {/* ───────── Liquid cash + capital snapshot ───────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--rule)] border border-[var(--rule)] stagger">
        <div className="bg-[var(--paper-1)] p-5">
          <div className="stat-label">Liquid cash</div>
          <input
            type="number"
            step="0.01"
            className="font-display text-[var(--ink-1)] mt-3 w-full bg-transparent border-0 outline-none focus:bg-[var(--paper-2)]"
            style={{ fontWeight: 500, fontSize: '28px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}
            value={liquid}
            onChange={(e) => setBalance({ ...balance, liquidCash: parseFloat(e.target.value || '0') })}
            aria-label="Liquid cash"
          />
          <div className="text-[11px] text-[var(--ink-3)] mt-1">Tap to update</div>
        </div>

        <div className="bg-[var(--paper-1)] p-5">
          <div className="stat-label">Operating</div>
          <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
               style={{ fontWeight: 500, fontSize: '28px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedCurrency value={op} />
          </div>
          <div className="text-[11px] text-[var(--ink-3)] mt-2">Tied up in cycles</div>
        </div>

        <div className="bg-[var(--paper-1)] p-5">
          <div className="stat-label">Pending CardCash</div>
          <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
               style={{ fontWeight: 500, fontSize: '28px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedCurrency value={pending} />
          </div>
          <div className="text-[11px] text-[var(--ink-3)] mt-2">Awaiting payout</div>
        </div>

        <div className="bg-[var(--paper-1)] p-5">
          <div className="stat-label">Total profit</div>
          <div className="font-display mt-3 leading-none"
               style={{ fontWeight: 500, fontSize: '28px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', color: profit >= 0 ? 'var(--ink-1)' : 'var(--clay-500, #c45f3f)' }}>
            <AnimatedCurrency value={profit} />
          </div>
          <div className="text-[11px] text-[var(--ink-3)] mt-2">Paid + projected</div>
        </div>
      </section>

      {/* ───────── Cycle log ───────── */}
      <section className="animate-slide-up">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-5 pb-3 border-b border-[var(--rule)]">
          <div>
            <div className="page-eyebrow"><Zap size={11} strokeWidth={1.6} /> Cycles</div>
            <h2 className="font-display text-[var(--ink-1)] mt-2"
                style={{ fontWeight: 500, fontSize: '22px', letterSpacing: '-0.02em' }}>
              Cycle log
            </h2>
            <p className="section-sub">Every order from purchase to payout.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setEditing({})}>
            <Plus size={13} strokeWidth={1.6} /> Add cycle
          </button>
        </div>
        <CycleList
          cycles={cycles}
          privacyCards={privacyCards}
          onEdit={(c) => setEditing(c)}
          onDelete={(c) => deleteCycle(c)}
          onDuplicate={duplicateCycle}
          onNew={() => setEditing({})}
          onSetStatus={setStatus}
          onBulkSetStatus={bulkSetStatus}
          onBulkDelete={bulkDelete}
        />
      </section>

      {/* ───────── Privacy cards ───────── */}
      <PrivacyCards />

      {/* ───────── Projector ───────── */}
      <Projector />

      <CycleForm
        open={editing !== null}
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={saveCycle}
      />
      <SheetsImport open={sheetsOpen} onClose={() => setSheetsOpen(false)} />
    </div>
  )
}

function CycleStatCell({ label, value, pulse }) {
  return (
    <div className="bg-[var(--paper-1)] px-4 py-5">
      <div className="flex items-center gap-2">
        <span className="relative inline-flex">
          <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
          {pulse && (
            <span className="absolute inset-0 w-1 h-1 rounded-full bg-[var(--accent)] animate-ping-slow" />
          )}
        </span>
        <div className="stat-label">{label}</div>
      </div>
      <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
           style={{ fontWeight: 500, fontSize: '32px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

function AnimatedCurrency({ value, className = '' }) {
  const v = useCountUp(value || 0, { duration: 800 })
  return <span className={className}>{fmtCurrency(v)}</span>
}
