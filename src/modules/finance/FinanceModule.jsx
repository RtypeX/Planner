import { useState } from 'react'
import { Wallet, DollarSign, Clock, PiggyBank, Plus, Trash2, Target, Sparkles } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Modal from '../../components/ui/Modal'
import SectionHeader from '../../components/ui/SectionHeader'
import FinanceCharts from './FinanceCharts'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { useCountUp } from '../../lib/animation'
import { fmtCurrency, operatingCapital, pendingCardCash, totalAllTimeProfit, paidProfit } from '../../lib/calc'

export default function FinanceModule() {
  const { balance, setBalance, cycles, goals, setGoals, undoableDelete } = useAppData()
  const [adding, setAdding] = useState(false)

  const op = operatingCapital(cycles)
  const pending = pendingCardCash(cycles)
  const liquid = Number(balance.liquidCash || 0)
  const savings = Number(balance.personalSavings || 0)
  const realized = paidProfit(cycles)

  const netWorth = liquid + op + pending + savings

  const updateBalance = (patch) => setBalance({ ...balance, ...patch })

  const addGoal = (g) => setGoals([...goals, { ...g, id: uid(), locked: false }])
  const updateGoal = (id, patch) => setGoals(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const deleteGoal = (g) => {
    undoableDelete({
      label: `Goal "${g.name}"`,
      perform: () => setGoals((prev) => prev.filter((x) => x.id !== g.id)),
      restore: () => setGoals((prev) => [...prev, g]),
    })
  }

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
        <h1 className="page-title">Net worth & goals</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
          Balances · realized profit · goal pacing
        </p>
      </header>

      {/* ───────── Net worth lede ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6">
        <div className="lg:col-span-7 lede">
          <div className="stat-label">Net worth</div>
          <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
               style={{ fontWeight: 500, fontSize: 'clamp(56px, 48px + 2.5vw, 96px)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedHero value={netWorth} />
          </div>
          <div className="text-[var(--ink-3)] mt-3">
            Liquid + operating + pending + personal savings
          </div>
        </div>
        <div className="lg:col-span-5 grid grid-cols-2 gap-px bg-[var(--rule)] border border-[var(--rule)] self-end stagger">
          <SegCell label="Liquid"    value={liquid}  total={netWorth} />
          <SegCell label="Operating" value={op}      total={netWorth} />
          <SegCell label="Pending"   value={pending} total={netWorth} />
          <SegCell label="Savings"   value={savings} total={netWorth} />
        </div>
      </section>

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
                        onClick={() => deleteGoal(g)}
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

function SegCell({ label, value, total }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const animPct = useCountUp(pct, { duration: 900, decimals: 0 })
  return (
    <div className="bg-[var(--paper-1)] px-4 py-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="stat-label">{label}</div>
        <div className="font-mono text-[10px] tabular-nums text-[var(--ink-3)]">
          {animPct.toFixed(0)}%
        </div>
      </div>
      <div className="font-display text-[var(--ink-1)] leading-none"
           style={{ fontWeight: 500, fontSize: '20px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {fmtCurrency(value)}
      </div>
    </div>
  )
}

function AnimatedHero({ value }) {
  const v = useCountUp(value, { duration: 1100 })
  return <>{fmtCurrency(v)}</>
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
