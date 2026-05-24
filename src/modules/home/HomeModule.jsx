import { useState } from 'react'
import {
  Home, Plus, Sparkles, ArrowRight, Wallet, TrendingUp, Trophy, Truck,
  Dumbbell, Map as MapIcon, Activity, Flame, Target, Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAppData } from '../../lib/AppData'
import { useCountUp } from '../../lib/animation'
import { uid } from '../../lib/storage'
import { PC_GOAL, BMT_TARGETS } from '../../lib/defaults'
import {
  fmtCurrency, fmtDateShort,
  totalAllTimeProfit, cyclesCompleted, operatingCapital, pendingCardCash,
} from '../../lib/calc'
import {
  greeting, pickHeroFocus, getActiveShipments, getNextMilestones, getWeekStats, getWorkoutStreak,
} from '../../lib/insights'
import CycleForm from '../arbitrage/CycleForm'
import BackupReminder from '../../components/BackupReminder'
import WeeklySummary from '../../components/WeeklySummary'

export default function HomeModule({ goTo, onOpenAssistant }) {
  const {
    cycles, setCycles, balance, workouts, milestones, fitnessBaselines,
  } = useAppData()
  const [editingCycle, setEditingCycle] = useState(null)

  const profit = totalAllTimeProfit(cycles)
  const completed = cyclesCompleted(cycles)
  const liquid = Number(balance.liquidCash || 0)
  const savings = Number(balance.personalSavings || 0)
  const op = operatingCapital(cycles)
  const pending = pendingCardCash(cycles)
  const netWorth = liquid + op + pending + savings

  const focus = pickHeroFocus({ cycles, milestones, profit, pcGoal: PC_GOAL })
  const shipments = getActiveShipments(cycles).slice(0, 3)
  const upNext = getNextMilestones(milestones, 3)
  const week = getWeekStats(cycles, workouts)

  // BMT readiness
  const runScore = fitnessBaselines.runSeconds
    ? Math.min(100, (BMT_TARGETS.runSeconds / fitnessBaselines.runSeconds) * 100) : 0
  const pushScore = Math.min(100, ((fitnessBaselines.pushups || 0) / BMT_TARGETS.pushupsGoal) * 100)
  const sitScore = Math.min(100, ((fitnessBaselines.situps || 0) / BMT_TARGETS.situpsGoal) * 100)
  const readiness = Math.round((runScore + pushScore + sitScore) / 3)

  // Streak — uses the latest-logged-day anchor so today not yet logged
  // doesn't reset the count.
  const { streak, atRisk } = getWorkoutStreak(workouts)

  const profitAnim = useCountUp(Math.max(0, profit), { duration: 1000 })
  const netWorthAnim = useCountUp(netWorth, { duration: 1000 })
  const readinessAnim = useCountUp(readiness, { duration: 900 })
  const streakAnim = useCountUp(streak, { duration: 600 })

  const saveCycle = (cycle) => {
    if (cycle.id) setCycles((prev) => prev.map((c) => (c.id === cycle.id ? cycle : c)))
    else setCycles((prev) => [{ ...cycle, id: uid() }, ...prev])
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <BackupReminder />

      {/* Greeting + quick actions */}
      <header className="flex items-end justify-between gap-3 flex-wrap animate-slide-down">
        <div>
          <div className="page-eyebrow"><Home size={11} /> Home</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900 dark:text-white">
            {greeting()}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d')} · Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] text-[11px] font-mono">⌘K</kbd> for quick actions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAssistant && (
            <button className="btn-secondary" onClick={onOpenAssistant} title="Open AI assistant">
              <Sparkles size={15} /> Ask AI
            </button>
          )}
          <button className="btn-secondary" onClick={() => goTo?.('fitness')}>
            <Dumbbell size={15} /> Log workout
          </button>
          <button className="btn-primary" onClick={() => setEditingCycle({})}>
            <Plus size={16} /> New cycle
          </button>
        </div>
      </header>

      {/* Hero focus card */}
      <FocusCard focus={focus} onAction={(kind, payload) => {
        if (kind === 'shipment')   goTo?.('arbitrage')
        else if (kind === 'milestone') goTo?.('timeline')
        else if (kind === 'pc-goal')  goTo?.('arbitrage')
      }} />

      {/* Top metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        <button className="text-left" onClick={() => goTo?.('finance')}>
          <StatCard
            variant="compact"
            label="Net worth"
            value={fmtCurrency(netWorthAnim)}
            sub={`Liquid + tied up + savings`}
            icon={Wallet}
            accent="brand"
          />
        </button>
        <button className="text-left" onClick={() => goTo?.('arbitrage')}>
          <StatCard
            variant="compact"
            label="Total profit"
            value={fmtCurrency(profitAnim)}
            sub={`${completed} cycle${completed === 1 ? '' : 's'} paid`}
            icon={TrendingUp}
            accent={profit >= 0 ? 'emerald' : 'rose'}
          />
        </button>
        <button className="text-left" onClick={() => goTo?.('fitness')}>
          <StatCard
            variant="compact"
            label="BMT readiness"
            value={`${Math.round(readinessAnim)}%`}
            sub={readiness >= 100 ? 'Above standard' : `${100 - readiness}% to go`}
            icon={Activity}
            accent={readiness >= 70 ? 'emerald' : readiness >= 40 ? 'amber' : 'rose'}
          />
        </button>
        <button className="text-left" onClick={() => goTo?.('fitness')}>
          <StatCard
            variant="compact"
            label="Workout streak"
            value={`${streakAnim} d`}
            sub={streak > 0 ? (atRisk ? '⚠️ Log today to extend' : '🔥 Keep it up') : 'Log one to start'}
            icon={Flame}
            accent={streak > 0 ? (atRisk ? 'amber' : 'amber') : 'slate'}
          />
        </button>
      </div>

      {/* PC goal mini hero */}
      <div className="card-padded card-hover">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="page-eyebrow"><Sparkles size={11} /> PC Goal</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {fmtCurrency(profitAnim)}
              </span>
              <span className="text-base sm:text-lg font-semibold text-slate-400 dark:text-slate-500">
                / {fmtCurrency(PC_GOAL)}
              </span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {profit >= PC_GOAL
                ? '🎉 Goal reached — go build that PC.'
                : `${fmtCurrency(Math.max(0, PC_GOAL - profit))} to go`}
            </div>
          </div>
          <button className="btn-secondary" onClick={() => goTo?.('arbitrage')}>
            <Target size={15} /> View arbitrage <ArrowRight size={13} />
          </button>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={Math.max(0, profit)}
            max={PC_GOAL}
            color={profit >= PC_GOAL ? 'emerald' : 'brand'}
            showPct
          />
        </div>
      </div>

      {/* Two-column: Up next + Active shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Up next milestones */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="icon-tile bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <MapIcon size={15} />
              </div>
              <div>
                <h3 className="section-title">Up next</h3>
                <p className="section-sub">Closest milestones</p>
              </div>
            </div>
            <button className="btn-ghost text-xs" onClick={() => goTo?.('timeline')}>
              See all <ArrowRight size={12} />
            </button>
          </div>
          {upNext.length === 0 ? (
            <div className="card-padded text-center text-sm text-slate-500 dark:text-slate-400">
              No upcoming milestones.
            </div>
          ) : (
            <div className="space-y-2 stagger">
              {upNext.map((m) => (
                <UpNextCard key={m.id} milestone={m} onClick={() => goTo?.('timeline')} />
              ))}
            </div>
          )}
        </section>

        {/* Active shipments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="icon-tile bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <Truck size={15} />
              </div>
              <div>
                <h3 className="section-title">In transit</h3>
                <p className="section-sub">{shipments.length} active shipment{shipments.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <button className="btn-ghost text-xs" onClick={() => goTo?.('arbitrage')}>
              See all <ArrowRight size={12} />
            </button>
          </div>
          {shipments.length === 0 ? (
            <div className="card-padded text-center text-sm text-slate-500 dark:text-slate-400">
              No active shipments.
            </div>
          ) : (
            <div className="space-y-2 stagger">
              {shipments.map((c) => (
                <ShipmentCard key={c.id} cycle={c} onClick={() => goTo?.('arbitrage')} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* This week summary */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="icon-tile bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <Calendar size={15} />
          </div>
          <div>
            <h3 className="section-title">This week</h3>
            <p className="section-sub">Last 7 days · rolling</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
          <StatCard variant="compact" label="Cycles added"   value={week.cyclesAdded}            icon={TrendingUp} accent="brand" />
          <StatCard variant="compact" label="Cycles paid"    value={week.cyclesPaid}             icon={Trophy}     accent="emerald" />
          <StatCard variant="compact" label="Workouts"       value={week.workouts}               icon={Dumbbell}   accent="violet" />
          <StatCard
            variant="compact"
            label="Profit added"
            value={fmtCurrency(week.profitDelta)}
            icon={Sparkles}
            accent={week.profitDelta >= 0 ? 'emerald' : 'rose'}
          />
        </div>
      </section>

      {/* AI weekly summary */}
      <WeeklySummary onOpenAssistant={onOpenAssistant} />

      <CycleForm
        open={editingCycle !== null}
        initial={editingCycle}
        onClose={() => setEditingCycle(null)}
        onSave={saveCycle}
      />
    </div>
  )
}

function FocusCard({ focus, onAction }) {
  const tones = {
    rose: {
      bg: 'from-rose-500 via-rose-600 to-pink-700',
      label: 'Action needed',
    },
    amber: {
      bg: 'from-amber-500 via-orange-600 to-rose-700',
      label: 'Heads up',
    },
    brand: {
      bg: 'from-brand-500 via-brand-600 to-indigo-700',
      label: 'Focus',
    },
    emerald: {
      bg: 'from-emerald-500 via-teal-600 to-cyan-700',
      label: 'On track',
    },
  }
  const t = tones[focus.tone] || tones.brand
  return (
    <button
      onClick={() => onAction(focus.kind, focus)}
      className={`card-hero w-full text-left p-5 sm:p-6 !bg-none bg-gradient-to-br ${t.bg} animate-scale-in`}
      style={{ backgroundSize: '180% 180%' }}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-white/70 flex items-center gap-2">
            <Sparkles size={11} className="animate-soft-pulse" /> {t.label}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">
            {focus.title}
          </div>
          {focus.subtitle && (
            <div className="text-sm text-white/85 mt-1.5">{focus.subtitle}</div>
          )}
        </div>
        <div className="icon-tile bg-white/15 ring-1 ring-white/20 backdrop-blur shrink-0">
          <ArrowRight size={20} className="text-white" />
        </div>
      </div>
      {focus.kind === 'pc-goal' && (
        <div className="relative mt-5">
          <ProgressBar value={focus.pct} max={100} color="white" showPct={false} size="lg" onDark />
        </div>
      )}
    </button>
  )
}

function UpNextCard({ milestone, onClick }) {
  const m = milestone
  const dayLabel = m.days === 0
    ? 'Today'
    : m.days < 0
      ? `${Math.abs(m.days)}d overdue`
      : `${m.days}d`
  const tone = m.days < 0 ? 'rose' : m.days <= 7 ? 'amber' : 'brand'
  const toneCls = {
    rose:  'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
  }[tone]
  return (
    <button onClick={onClick} className="card card-hover w-full text-left p-3 flex items-center gap-3">
      <div className={`shrink-0 px-2.5 py-1.5 rounded-lg font-extrabold tabular-nums text-sm ${toneCls}`}>
        {dayLabel}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900 dark:text-white truncate">{m.title}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">{fmtDateShort(m.date)} · {m.category}</div>
      </div>
      <ArrowRight size={14} className="text-slate-400 shrink-0" />
    </button>
  )
}

function ShipmentCard({ cycle, onClick }) {
  const status = cycle.trackingStatus || 'In transit'
  return (
    <button onClick={onClick} className="card card-hover w-full text-left p-3 flex items-center gap-3">
      <div className="icon-tile bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 shrink-0">
        <Truck size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900 dark:text-white truncate">
          {cycle.model} <span className="text-slate-400 text-xs">× {cycle.quantity}</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
          <span className="font-mono">{cycle.trackingNumber}</span>
          <span className="opacity-50">·</span>
          <span>{status}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
          Delivers
        </div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {fmtDateShort(cycle.actualDelivery || cycle.expectedDelivery)}
        </div>
      </div>
    </button>
  )
}
