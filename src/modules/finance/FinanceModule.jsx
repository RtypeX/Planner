import { useState } from 'react'
import { Wallet, DollarSign, Clock, PiggyBank, Plus, Trash2, Target } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Confirm from '../../components/ui/Confirm'
import Modal from '../../components/ui/Modal'
import FinanceCharts from './FinanceCharts'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { fmtCurrency, operatingCapital, pendingCardCash, totalAllTimeProfit, paidProfit } from '../../lib/calc'
import { PC_GOAL } from '../../lib/defaults'

export default function FinanceModule() {
  const { balance, setBalance, cycles, goals, setGoals } = useAppData()
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const op = operatingCapital(cycles)
  const pending = pendingCardCash(cycles)
  const liquid = Number(balance.liquidCash || 0)
  const savings = Number(balance.personalSavings || 0)
  const realized = paidProfit(cycles)

  const netWorth = liquid + op + pending + savings

  const updateBalance = (patch) => setBalance({ ...balance, ...patch })

  const addGoal = (g) => setGoals([...goals, { ...g, id: uid(), locked: false }])
  const updateGoal = (id, patch) => setGoals(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const deleteGoal = (id) => setGoals(goals.filter((g) => g.id !== id))

  // Goal value: PC goal uses arbitrage profit; others use savings (default available)
  const goalValue = (g) => {
    if (g.id === 'g-pc') return Math.max(0, totalAllTimeProfit(cycles))
    return Math.max(0, savings + realized) // generic: how much we have toward savings goals
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finance Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Net worth · goals · realized profit</p>
      </header>

      {/* Balance breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Liquid cash" value={fmtCurrency(liquid)} icon={Wallet} accent="brand">
          <input
            type="number"
            step="0.01"
            className="input mt-1 text-sm"
            value={liquid}
            onChange={(e) => updateBalance({ liquidCash: parseFloat(e.target.value || '0') })}
            aria-label="Liquid cash"
          />
        </StatCard>

        <StatCard
          label="Operating capital"
          value={fmtCurrency(op)}
          sub="From arbitrage cycles"
          icon={DollarSign}
          accent="amber"
        />
        <StatCard
          label="Pending CardCash"
          value={fmtCurrency(pending)}
          sub="Submitted, awaiting"
          icon={Clock}
          accent="violet"
        />
        <StatCard label="Personal savings" value={fmtCurrency(savings)} icon={PiggyBank} accent="emerald">
          <input
            type="number"
            step="0.01"
            className="input mt-1 text-sm"
            value={savings}
            onChange={(e) => updateBalance({ personalSavings: parseFloat(e.target.value || '0') })}
            aria-label="Personal savings"
          />
        </StatCard>

        <div className="card-padded col-span-2 lg:col-span-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="stat-label">Net worth</div>
              <div className="stat-value">{fmtCurrency(netWorth)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Liquid + operating + pending + savings
              </div>
            </div>
            <div className="rounded-xl p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <SegBar label="Liquid" value={liquid} total={netWorth} color="bg-brand-500" />
            <SegBar label="Operating" value={op} total={netWorth} color="bg-amber-500" />
            <SegBar label="Pending" value={pending} total={netWorth} color="bg-violet-500" />
            <SegBar label="Savings" value={savings} total={netWorth} color="bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Goals */}
      <section className="card-padded">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="section-title flex items-center gap-2"><Target size={18} /> Goals</h3>
            <p className="section-sub">Track progress toward big-ticket items.</p>
          </div>
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add goal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((g) => {
            const value = goalValue(g)
            const pct = Math.min(100, (value / Math.max(1, g.target)) * 100)
            const done = value >= g.target
            return (
              <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {fmtCurrency(value)} <span className="text-slate-400">/ {fmtCurrency(g.target)}</span>
                      {done && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">✓ Hit</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      className="input w-28 text-sm"
                      value={g.target}
                      onChange={(e) => updateGoal(g.id, { target: parseFloat(e.target.value || '0') })}
                    />
                    {!g.locked && (
                      <button
                        className="btn-ghost !p-1.5 hover:!text-rose-600"
                        onClick={() => setConfirmDelete(g)}
                        aria-label="Delete goal"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={value} max={g.target} color={done ? 'emerald' : 'brand'} showPct />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Charts */}
      <FinanceCharts />

      <AddGoal open={adding} onClose={() => setAdding(false)} onSave={addGoal} />
      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteGoal(confirmDelete.id)}
        title="Delete goal?"
        message={`Remove "${confirmDelete?.name}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

function SegBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <div className="progress h-1.5">
        <div className={`progress-bar ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AddGoal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')

  const reset = () => { setName(''); setTarget('') }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset() }}
      title="Add custom goal"
      footer={
        <>
          <button className="btn-secondary" onClick={() => { onClose(); reset() }}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!name.trim() || !target}
            onClick={() => { onSave({ name: name.trim(), target: parseFloat(target) || 0 }); reset(); onClose() }}
          >
            Save goal
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" />
        </div>
        <div>
          <label className="label">Target amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="1000"
          />
        </div>
      </div>
    </Modal>
  )
}
