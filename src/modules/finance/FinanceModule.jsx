import { useState } from 'react'
import { Wallet, DollarSign, Clock, PiggyBank, Plus, Trash2, Target, Sparkles } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Confirm from '../../components/ui/Confirm'
import Modal from '../../components/ui/Modal'
import SectionHeader from '../../components/ui/SectionHeader'
import FinanceCharts from './FinanceCharts'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { useCountUp } from '../../lib/animation'
import { fmtCurrency, operatingCapital, pendingCardCash, totalAllTimeProfit, paidProfit } from '../../lib/calc'

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

  const goalValue = (g) => {
    if (g.id === 'g-pc') return Math.max(0, totalAllTimeProfit(cycles))
    return Math.max(0, savings + realized)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="animate-slide-down">
        <div className="page-eyebrow">
          <Wallet size={11} /> Finance
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900 dark:text-white">
          Net worth & goals
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Balances · realized profit · goal pacing
        </p>
      </header>

      {/* ───────── Net worth hero ───────── */}
      <div className="card-hero p-5 sm:p-7 animate-scale-in">
        <div className="relative flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-white/70 flex items-center gap-2">
              <Sparkles size={11} className="animate-soft-pulse" /> Net worth
            </div>
            <AnimatedHero value={netWorth} className="text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight mt-2" />
            <div className="mt-1 text-sm text-white/80">
              Liquid + operating + pending + personal savings
            </div>
          </div>
          <div className="icon-tile bg-white/15 ring-1 ring-white/20 backdrop-blur shrink-0">
            <Wallet size={22} className="text-white" />
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 stagger">
          <SegBar label="Liquid"    value={liquid}  total={netWorth} dot="bg-sky-300" />
          <SegBar label="Operating" value={op}      total={netWorth} dot="bg-amber-300" />
          <SegBar label="Pending"   value={pending} total={netWorth} dot="bg-violet-300" />
          <SegBar label="Savings"   value={savings} total={netWorth} dot="bg-emerald-300" />
        </div>
      </div>

      {/* ───────── Editable balances ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 stagger">
        <EditableBalance
          label="Liquid cash"
          value={liquid}
          icon={Wallet}
          accent="brand"
          onChange={(v) => updateBalance({ liquidCash: v })}
        />
        <EditableBalance
          label="Personal savings"
          value={savings}
          icon={PiggyBank}
          accent="emerald"
          onChange={(v) => updateBalance({ personalSavings: v })}
        />
        <StatCard
          variant="compact"
          label="Operating capital"
          value={fmtCurrency(op)}
          sub="From arbitrage cycles"
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
      </div>

      {/* ───────── Goals ───────── */}
      <section>
        <SectionHeader
          icon={Target}
          accent="emerald"
          eyebrow="Targets"
          title="Goals"
          sub="Track progress toward big-ticket items."
          actions={
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add goal
            </button>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 stagger">
          {goals.map((g) => {
            const value = goalValue(g)
            const pct = Math.min(100, (value / Math.max(1, g.target)) * 100)
            const done = value >= g.target
            return (
              <div key={g.id} className="card-padded card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white">{g.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      {fmtCurrency(value)} <span className="opacity-60">/ {fmtCurrency(g.target)}</span>
                      {done && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Hit</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      className="input w-24 text-sm"
                      value={g.target}
                      onChange={(e) => updateGoal(g.id, { target: parseFloat(e.target.value || '0') })}
                    />
                    {!g.locked && (
                      <button
                        className="btn-ghost !p-1.5 hover:!text-rose-600"
                        onClick={() => setConfirmDelete(g)}
                        aria-label="Delete goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={value} max={g.target} color={done ? 'emerald' : 'brand'} showPct />
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {done ? 'Goal reached' : `${fmtCurrency(g.target - value)} remaining`}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ───────── Charts ───────── */}
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

function EditableBalance({ label, value, icon: Icon, accent, onChange }) {
  const accents = {
    brand:   'text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
  }
  return (
    <div className="card-padded card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-1.5">{fmtCurrency(value)}</div>
        </div>
        <div className={`icon-tile shrink-0 ${accents[accent] || accents.brand}`}>
          <Icon size={18} />
        </div>
      </div>
      <input
        type="number"
        step="0.01"
        className="input mt-3 text-sm"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value || '0'))}
        aria-label={label}
      />
    </div>
  )
}

function SegBar({ label, value, total, dot }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const animPct = useCountUp(pct, { duration: 900, decimals: 0 })
  return (
    <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur p-2.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {label}
        </span>
        <span className="tabular-nums">{animPct.toFixed(0)}%</span>
      </div>
      <div className="text-base font-extrabold tabular-nums tracking-tight">{fmtCurrency(value)}</div>
    </div>
  )
}

function AnimatedHero({ value, className = '' }) {
  const v = useCountUp(value, { duration: 1100 })
  return <div className={className}>{fmtCurrency(v)}</div>
}

function AddGoal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')

  const reset = () => { setName(''); setTarget('') }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset() }}
      eyebrow="New goal"
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
