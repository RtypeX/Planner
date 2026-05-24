import { useState } from 'react'
import {
  Plus, DollarSign, Wallet, Clock, TrendingUp, Trophy, Target,
  RefreshCw, Truck, Sparkles, Zap,
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Confirm from '../../components/ui/Confirm'
import CycleForm from './CycleForm'
import CycleList from './CycleTable'
import PrivacyCards from './PrivacyCards'
import Projector from './Projector'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { PC_GOAL } from '../../lib/defaults'
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
  } = useAppData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [refreshingAll, setRefreshingAll] = useState(false)

  const op = operatingCapital(cycles)
  const pending = pendingCardCash(cycles)
  const profit = totalAllTimeProfit(cycles)
  const completed = cyclesCompleted(cycles)
  const liquid = Number(balance.liquidCash || 0)
  const trackedCount = cycles.filter((c) => c.trackingNumber && c.status !== 'Paid').length
  const proxyConfigured = !!settings.trackingProxyUrl
  const pcPct = Math.max(0, Math.min(100, (profit / PC_GOAL) * 100))
  const pcRemaining = Math.max(0, PC_GOAL - profit)

  const saveCycle = (cycle) => {
    if (cycle.id) setCycles((prev) => prev.map((c) => (c.id === cycle.id ? cycle : c)))
    else setCycles((prev) => [{ ...cycle, id: uid() }, ...prev])
  }
  const deleteCycle = (cycle) => setCycles((prev) => prev.filter((c) => c.id !== cycle.id))

  const handleRefreshAll = async () => {
    setRefreshingAll(true)
    try { await refreshAllTracking() } finally { setRefreshingAll(false) }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* ───────── Page header ───────── */}
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="page-eyebrow">
            <TrendingUp size={11} /> Arbitrage
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900 dark:text-white">
            Cycle command
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            iPhone flips · MobileX trade-in · CardCash payouts
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {trackedCount > 0 && (
            <button
              className="btn-secondary"
              onClick={handleRefreshAll}
              disabled={refreshingAll}
              title={proxyConfigured ? `Refresh ${trackedCount} active shipments` : 'Configure proxy URL in Settings'}
            >
              <RefreshCw size={15} className={refreshingAll ? 'animate-spin' : ''} />
              {refreshingAll ? 'Refreshing…' : `Refresh tracking (${trackedCount})`}
            </button>
          )}
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus size={16} /> New cycle
          </button>
        </div>
      </header>

      {/* ───────── Hero + stats ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hero PC goal */}
        <div className="lg:col-span-2">
          <div className="card-hero p-5 sm:p-7 h-full">
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-white/70 flex items-center gap-2">
                  <Sparkles size={11} /> PC Goal
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight mt-2">
                  {fmtCurrency(Math.max(0, profit))}
                  <span className="text-xl sm:text-2xl font-semibold text-white/60 ml-2">
                    / {fmtCurrency(PC_GOAL)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-white/80">
                  {profit >= PC_GOAL
                    ? '🎉 Goal reached — go build that PC.'
                    : `${fmtCurrency(pcRemaining)} to go · ${pcPct.toFixed(0)}% there`}
                </div>
              </div>
              <div className="icon-tile bg-white/15 ring-1 ring-white/20 backdrop-blur shrink-0">
                <Target size={22} className="text-white" />
              </div>
            </div>
            <div className="relative mt-5">
              <ProgressBar
                value={Math.max(0, profit)}
                max={PC_GOAL}
                color="white"
                showPct={false}
                size="lg"
                onDark
              />
            </div>
            <div className="relative mt-5 grid grid-cols-3 gap-3">
              <HeroStatRow label="Cycles" value={completed} accent="emerald" />
              <HeroStatRow label="In transit" value={trackedCount} accent="amber" />
              <HeroStatRow label="Tracked" value={cycles.length} accent="brand" />
            </div>
          </div>
        </div>

        {/* Liquid cash editable */}
        <div className="card-padded card-hover">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="stat-label">Liquid cash</div>
              <div className="stat-value mt-1.5">{fmtCurrency(liquid)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tap to update available capital
              </div>
            </div>
            <div className="icon-tile bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 shrink-0">
              <Wallet size={18} />
            </div>
          </div>
          <input
            type="number"
            step="0.01"
            className="input mt-4 text-sm"
            value={liquid}
            onChange={(e) => setBalance({ ...balance, liquidCash: parseFloat(e.target.value || '0') })}
            aria-label="Liquid cash"
          />
        </div>
      </div>

      {/* Compact stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          variant="compact"
          label="Operating capital"
          value={fmtCurrency(op)}
          sub="Tied up in active cycles"
          icon={DollarSign}
          accent="amber"
        />
        <StatCard
          variant="compact"
          label="Pending CardCash"
          value={fmtCurrency(pending)}
          sub="Submitted, awaiting payout"
          icon={Clock}
          accent="violet"
        />
        <StatCard
          variant="compact"
          label="Total profit"
          value={fmtCurrency(profit)}
          sub="All-time, paid + projected"
          icon={TrendingUp}
          accent={profit >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          variant="compact"
          label="In transit"
          value={trackedCount}
          sub={proxyConfigured ? 'Live status enabled' : 'Add proxy in Settings'}
          icon={Truck}
          accent="brand"
        />
      </div>

      {/* ───────── Cycle log ───────── */}
      <section>
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <div className="page-eyebrow">
              <Zap size={11} /> Cycles
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Cycle log</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Every order from purchase to payout.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setEditing({})}>
            <Plus size={15} /> Add cycle
          </button>
        </div>
        <CycleList
          cycles={cycles}
          privacyCards={privacyCards}
          onEdit={(c) => setEditing(c)}
          onDelete={(c) => setConfirmDelete(c)}
          onNew={() => setEditing({})}
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
      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteCycle(confirmDelete)}
        title="Delete cycle?"
        message="This permanently removes the cycle from your log."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

function HeroStatRow({ label, value, accent }) {
  const dots = {
    emerald: 'bg-emerald-300',
    amber: 'bg-amber-300',
    brand: 'bg-sky-300',
  }
  return (
    <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
        <span className={`w-1.5 h-1.5 rounded-full ${dots[accent] || dots.brand}`} />
        {label}
      </div>
      <div className="text-2xl font-extrabold tabular-nums mt-1">{value}</div>
    </div>
  )
}
