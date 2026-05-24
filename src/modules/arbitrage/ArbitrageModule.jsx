import { useState } from 'react'
import { Plus, DollarSign, Wallet, Clock, TrendingUp, Trophy, Target } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Confirm from '../../components/ui/Confirm'
import CycleForm from './CycleForm'
import CycleTable from './CycleTable'
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
  const { cycles, setCycles, balance, setBalance, privacyCards } = useAppData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const op = operatingCapital(cycles)
  const pending = pendingCardCash(cycles)
  const profit = totalAllTimeProfit(cycles)
  const completed = cyclesCompleted(cycles)
  const liquid = Number(balance.liquidCash || 0)

  const saveCycle = (cycle) => {
    if (cycle.id) {
      setCycles((prev) => prev.map((c) => (c.id === cycle.id ? cycle : c)))
    } else {
      setCycles((prev) => [{ ...cycle, id: uid() }, ...prev])
    }
  }
  const deleteCycle = (cycle) => setCycles((prev) => prev.filter((c) => c.id !== cycle.id))

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Arbitrage Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">iPhone flips · MobileX · CardCash payouts</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} /> New cycle
        </button>
      </header>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Liquid cash"
          value={fmtCurrency(liquid)}
          icon={Wallet}
          accent="brand"
        >
          <input
            type="number"
            step="0.01"
            className="input mt-1 text-sm"
            value={liquid}
            onChange={(e) => setBalance({ ...balance, liquidCash: parseFloat(e.target.value || '0') })}
            aria-label="Liquid cash"
          />
        </StatCard>

        <StatCard
          label="Operating capital"
          value={fmtCurrency(op)}
          sub="Tied up in active cycles"
          icon={DollarSign}
          accent="amber"
        />

        <StatCard
          label="Pending CardCash"
          value={fmtCurrency(pending)}
          sub="Submitted, awaiting payout"
          icon={Clock}
          accent="violet"
        />

        <StatCard
          label="Total profit"
          value={fmtCurrency(profit)}
          sub="All-time, paid + projected"
          icon={TrendingUp}
          accent={profit >= 0 ? 'emerald' : 'rose'}
        />

        <div className="card-padded col-span-2 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="stat-label">PC goal</div>
              <div className="stat-value">{fmtCurrency(Math.min(profit, PC_GOAL))} <span className="text-base font-medium text-slate-400">/ {fmtCurrency(PC_GOAL)}</span></div>
            </div>
            <div className="rounded-xl p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Target size={20} />
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar value={Math.max(0, profit)} max={PC_GOAL} color="emerald" showPct={true} />
          </div>
        </div>

        <StatCard
          label="Cycles completed"
          value={completed}
          sub={`${cycles.length} total tracked`}
          icon={Trophy}
          accent="emerald"
        />

        <StatCard
          label="Net worth (arb)"
          value={fmtCurrency(liquid + op + pending)}
          sub="Liquid + operating + pending"
          icon={Wallet}
          accent="brand"
        />
      </div>

      {/* Cycle log */}
      <section className="card-padded">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="section-title">Cycle log</h3>
            <p className="section-sub">Every order from purchase to payout.</p>
          </div>
          <button className="btn-secondary" onClick={() => setEditing({})}>
            <Plus size={16} /> Add
          </button>
        </div>
        <CycleTable
          cycles={cycles}
          privacyCards={privacyCards}
          onEdit={(c) => setEditing(c)}
          onDelete={(c) => setConfirmDelete(c)}
        />
      </section>

      {/* Privacy cards */}
      <PrivacyCards />

      {/* Projector */}
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
