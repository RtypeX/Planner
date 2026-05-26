import { useState } from 'react'
import {
  Plus, ArrowRight, Wallet, TrendingUp, Trophy, Truck,
  Dumbbell, Activity, Flame, Target, Calendar, Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import { LiquidButton } from '../../components/ui/liquid-glass-button'
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
  const { cycles, setCycles, balance, workouts, milestones, fitnessBaselines } = useAppData()
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

  const runScore = fitnessBaselines.runSeconds
    ? Math.min(100, (BMT_TARGETS.runSeconds / fitnessBaselines.runSeconds) * 100) : 0
  const pushScore = Math.min(100, ((fitnessBaselines.pushups || 0) / BMT_TARGETS.pushupsGoal) * 100)
  const sitScore = Math.min(100, ((fitnessBaselines.situps || 0) / BMT_TARGETS.situpsGoal) * 100)
  const readiness = Math.round((runScore + pushScore + sitScore) / 3)

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
    <div className="space-y-7">
      <BackupReminder />

      {/* ═══════ Greeting + actions ═══════ */}
      <header className="animate-spring-down">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-5">
          <div className="text-[13px] text-[var(--label-3)]">
            {format(new Date(), 'EEEE · MMMM d')}
          </div>
          <div className="flex items-center gap-2">
            {onOpenAssistant && (
              <button className="btn btn-secondary" onClick={onOpenAssistant}>
                <Sparkles size={14} strokeWidth={1.8} /> Assistant
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => goTo?.('fitness')}>
              <Dumbbell size={14} strokeWidth={1.8} /> Workout
            </button>
            <LiquidButton size="sm" onClick={() => setEditingCycle({})} className="!h-9 !px-5 text-[14px] font-semibold">
              <Plus size={15} strokeWidth={2.2} /> New cycle
            </LiquidButton>
          </div>
        </div>

        <h1 className="page-title">{greeting()}.</h1>
        <p className="page-subtitle max-w-2xl">
          {focus.title.toLowerCase()}{focus.subtitle ? <> — <span className="text-[var(--label-2)]">{focus.subtitle}</span></> : ''}
        </p>
      </header>

      {/* ═══════ Hero numbers ═══════ */}
      <section className="card-padded card-hover relative overflow-hidden">
        {/* Vibrancy orbs that the glass refracts */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-sys-blue/30 blur-3xl pointer-events-none animate-aurora-pan" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sys-purple/25 blur-3xl pointer-events-none animate-aurora-pan" style={{ animationDelay: '6s' }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-7 relative z-10">
          <div className="lg:col-span-7">
            <StatCard
              variant="hero"
              label="Net worth"
              value={fmtCurrency(netWorthAnim)}
              sub={`${fmtCurrency(liquid)} liquid · ${fmtCurrency(op)} tied up · ${fmtCurrency(pending)} pending · ${fmtCurrency(savings)} savings`}
            />
          </div>
          <div className="lg:col-span-5 lg:border-l lg:border-[var(--separator)] lg:pl-10 self-end">
            <div className="stat-label">PC goal</div>
            <div className="font-bold text-[var(--label-1)] mt-2 leading-none tracking-tightest"
                 style={{ fontSize: '40px', fontVariantNumeric: 'tabular-nums' }}>
              {fmtCurrency(profitAnim)}
              <span className="text-[var(--label-3)] text-[20px] ml-2 font-semibold">/ {fmtCurrency(PC_GOAL)}</span>
            </div>
            <div className="mt-4">
              <ProgressBar
                value={Math.max(0, profit)}
                max={PC_GOAL}
                color={profit >= PC_GOAL ? 'green' : 'blue'}
                shimmer={profit < PC_GOAL}
                showPct={false}
                size="lg"
              />
            </div>
            <div className="text-[13px] text-[var(--label-3)] mt-3">
              {profit >= PC_GOAL
                ? '🎉 Goal reached.'
                : `${fmtCurrency(Math.max(0, PC_GOAL - profit))} to go · ${Math.round((profit / PC_GOAL) * 100)}%`}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Vital signs grid ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <button className="text-left" onClick={() => goTo?.('arbitrage')}>
          <StatCard
            variant="compact"
            label="Profit"
            value={fmtCurrency(profitAnim)}
            sub={`${completed} cycles paid`}
            icon={TrendingUp}
            accent={profit >= 0 ? 'green' : 'red'}
          />
        </button>
        <button className="text-left" onClick={() => goTo?.('fitness')}>
          <StatCard
            variant="compact"
            label="BMT readiness"
            value={`${Math.round(readinessAnim)}%`}
            sub={readiness >= 100 ? 'Above standard' : `${100 - readiness}% to target`}
            icon={Activity}
            accent={readiness >= 70 ? 'green' : readiness >= 40 ? 'orange' : 'red'}
          />
        </button>
        <button className="text-left" onClick={() => goTo?.('fitness')}>
          <StatCard
            variant="compact"
            label="Streak"
            value={`${streakAnim}d`}
            sub={streak > 0 ? (atRisk ? '⚠ log today' : '🔥 going strong') : 'log to start'}
            icon={Flame}
            accent={streak > 0 ? (atRisk ? 'orange' : 'orange') : 'blue'}
          />
        </button>
        <button className="text-left" onClick={() => goTo?.('arbitrage')}>
          <StatCard
            variant="compact"
            label="In transit"
            value={shipments.length}
            sub={shipments.length === 0 ? 'no shipments' : `${shipments.length === 1 ? 'package' : 'packages'} en route`}
            icon={Truck}
            accent="purple"
          />
        </button>
      </div>

      {/* ═══════ Up next + In transit ═══════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Column
          label="Up next"
          sub="Closest milestones"
          tint="#ff9f0a"
          onSeeAll={() => goTo?.('timeline')}
          empty={upNext.length === 0}
          emptyText="Nothing scheduled."
        >
          <div className="space-y-2 stagger">
            {upNext.map((m) => (
              <UpNextRow key={m.id} milestone={m} onClick={() => goTo?.('timeline')} />
            ))}
          </div>
        </Column>

        <Column
          label="In transit"
          sub={`${shipments.length} active ${shipments.length === 1 ? 'shipment' : 'shipments'}`}
          tint="#bf5af2"
          onSeeAll={() => goTo?.('arbitrage')}
          empty={shipments.length === 0}
          emptyText="Nothing in transit."
        >
          <div className="space-y-2 stagger">
            {shipments.map((c) => (
              <ShipmentRow key={c.id} cycle={c} onClick={() => goTo?.('arbitrage')} />
            ))}
          </div>
        </Column>
      </section>

      {/* ═══════ This week ═══════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="page-eyebrow" style={{ color: '#30d158' }}>
            <Calendar size={11} strokeWidth={2} /> This week
          </div>
          <div className="text-[12px] text-[var(--label-3)]">Last 7 days</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          <StatCard variant="compact" label="Cycles added"   value={week.cyclesAdded}            icon={TrendingUp} accent="blue" />
          <StatCard variant="compact" label="Cycles paid"    value={week.cyclesPaid}             icon={Trophy}     accent="green" />
          <StatCard variant="compact" label="Workouts"       value={week.workouts}               icon={Dumbbell}   accent="purple" />
          <StatCard
            variant="compact"
            label="Profit added"
            value={fmtCurrency(week.profitDelta)}
            icon={Sparkles}
            accent={week.profitDelta >= 0 ? 'green' : 'red'}
          />
        </div>
      </section>

      {/* ═══════ Weekly digest ═══════ */}
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

function Column({ label, sub, tint = '#0a84ff', onSeeAll, empty, emptyText, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <div className="page-eyebrow" style={{ color: tint }}>{label}</div>
          {sub && <div className="text-[13px] text-[var(--label-3)] mt-1">{sub}</div>}
        </div>
        {onSeeAll && (
          <button className="btn btn-ghost text-[13px]" onClick={onSeeAll}>
            See all <ArrowRight size={12} strokeWidth={1.8} />
          </button>
        )}
      </div>
      {empty ? (
        <div className="card-padded text-[13px] text-[var(--label-3)]">{emptyText}</div>
      ) : children}
    </section>
  )
}

function UpNextRow({ milestone, onClick }) {
  const m = milestone
  const dayLabel = m.days === 0 ? 'Today' : m.days < 0 ? `${Math.abs(m.days)}d overdue` : `${m.days}d`
  const tone = m.days < 0 ? '#ff453a' : m.days <= 7 ? '#ff9f0a' : '#0a84ff'

  return (
    <button onClick={onClick}
            className="card-padded card-hover w-full text-left flex items-center gap-3 !p-3.5">
      <div className="shrink-0 px-3 py-2 rounded-xl font-bold tabular-nums text-[13px]"
           style={{
             background: `${tone}1A`,
             color: tone,
             border: `1px solid ${tone}30`,
           }}>
        {dayLabel}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[var(--label-1)] truncate">{m.title}</div>
        <div className="text-[12px] text-[var(--label-3)] mt-0.5">
          {fmtDateShort(m.date)} · {m.category}
        </div>
      </div>
      <ArrowRight size={14} strokeWidth={1.7} className="text-[var(--label-3)] shrink-0" />
    </button>
  )
}

function ShipmentRow({ cycle, onClick }) {
  const status = cycle.trackingStatus || 'In transit'
  return (
    <button onClick={onClick}
            className="card-padded card-hover w-full text-left flex items-center gap-3 !p-3.5">
      <div className="icon-tile shrink-0" style={{ color: '#bf5af2' }}>
        <Truck size={15} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[var(--label-1)] truncate">
          {cycle.model} <span className="text-[var(--label-3)] font-normal">× {cycle.quantity}</span>
        </div>
        <div className="text-[12px] text-[var(--label-3)] mt-0.5 truncate">
          {cycle.trackingNumber} · {status}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--label-3)]">Delivers</div>
        <div className="text-[12px] tabular-nums font-semibold text-[var(--label-1)] mt-0.5">
          {fmtDateShort(cycle.actualDelivery || cycle.expectedDelivery)}
        </div>
      </div>
    </button>
  )
}
