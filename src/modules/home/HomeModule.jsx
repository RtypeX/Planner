import { useState } from 'react'
import {
  Plus, ArrowRight, Wallet, TrendingUp, Trophy, Truck,
  Dumbbell, Activity, Flame, Target, Calendar, Sparkles,
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

  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="space-y-12">
      <BackupReminder />

      {/* ═══════ Masthead ═══════ */}
      <header className="animate-slide-down">
        <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
            {today}
          </div>
          <div className="flex items-center gap-2">
            {onOpenAssistant && (
              <button className="btn btn-secondary" onClick={onOpenAssistant}>
                <Sparkles size={13} strokeWidth={1.6} /> Assistant
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => goTo?.('fitness')}>
              <Dumbbell size={13} strokeWidth={1.6} /> Workout
            </button>
            <button className="btn btn-primary" onClick={() => setEditingCycle({})}>
              <Plus size={14} strokeWidth={2} /> New cycle
            </button>
          </div>
        </div>

        <h1 className="font-display text-[var(--ink-1)] leading-[1.02]"
            style={{
              fontWeight: 500,
              fontSize: 'clamp(40px, 32px + 3vw, 72px)',
              letterSpacing: '-0.035em',
            }}>
          {greeting()}.
        </h1>
        <p className="text-[var(--ink-3)] mt-3 max-w-2xl"
           style={{ fontSize: '15px' }}>
          {focus.title.toLowerCase()}{focus.subtitle ? <> — <span className="text-[var(--ink-2)]">{focus.subtitle}</span></> : ''}
        </p>
      </header>

      {/* ═══════ Top stat lede — net worth or PC goal ═══════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8">
        <div className="lg:col-span-7">
          <StatCard
            variant="hero"
            label="Net worth"
            value={fmtCurrency(netWorthAnim)}
            sub={`Liquid ${fmtCurrency(liquid)} · Tied up ${fmtCurrency(op)} · Pending ${fmtCurrency(pending)} · Savings ${fmtCurrency(savings)}`}
          />
        </div>
        <div className="lg:col-span-5 lede">
          <div className="stat-label">PC goal</div>
          <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
               style={{ fontWeight: 500, fontSize: '40px', letterSpacing: '-0.025em' }}>
            {fmtCurrency(profitAnim)}
            <span className="text-[var(--ink-3)] text-2xl ml-2">/ {fmtCurrency(PC_GOAL)}</span>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={Math.max(0, profit)}
              max={PC_GOAL}
              color={profit >= PC_GOAL ? 'sage' : 'accent'}
              showPct={false}
              size="lg"
            />
          </div>
          <div className="text-sm text-[var(--ink-3)] mt-3">
            {profit >= PC_GOAL
              ? 'Goal reached — go build that PC.'
              : `${fmtCurrency(Math.max(0, PC_GOAL - profit))} to go · ${Math.round((profit / PC_GOAL) * 100)}% there`}
          </div>
        </div>
      </section>

      {/* ═══════ Vital signs ═══════ */}
      <section>
        <Headline label="Vital signs" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--rule)] border border-[var(--rule)] stagger">
          <button className="text-left bg-[var(--paper-1)] hover:bg-[var(--paper-2)] transition-colors" onClick={() => goTo?.('arbitrage')}>
            <CompactCell label="Profit" value={fmtCurrency(profitAnim)} sub={`${completed} cycles paid`} accent={profit >= 0 ? 'sage' : 'clay'} />
          </button>
          <button className="text-left bg-[var(--paper-1)] hover:bg-[var(--paper-2)] transition-colors" onClick={() => goTo?.('fitness')}>
            <CompactCell label="BMT readiness" value={`${Math.round(readinessAnim)}%`} sub={readiness >= 100 ? 'Above standard' : `${100 - readiness}% to target`} accent={readiness >= 70 ? 'sage' : readiness >= 40 ? 'accent' : 'clay'} />
          </button>
          <button className="text-left bg-[var(--paper-1)] hover:bg-[var(--paper-2)] transition-colors" onClick={() => goTo?.('fitness')}>
            <CompactCell label="Workout streak" value={`${streakAnim}d`} sub={streak > 0 ? (atRisk ? 'log today to extend' : 'going strong') : 'log one to start'} accent={streak > 0 ? (atRisk ? 'accent' : 'sage') : 'ink'} />
          </button>
          <button className="text-left bg-[var(--paper-1)] hover:bg-[var(--paper-2)] transition-colors" onClick={() => goTo?.('finance')}>
            <CompactCell label="In transit" value={shipments.length} sub={shipments.length === 0 ? 'no active shipments' : `${shipments.length === 1 ? 'package' : 'packages'} on the way`} accent="ink" />
          </button>
        </div>
      </section>

      {/* ═══════ Up next + In transit ═══════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Column
          label="Up next"
          sub="Closest milestones"
          onSeeAll={() => goTo?.('timeline')}
          empty={upNext.length === 0}
          emptyText="Nothing scheduled."
        >
          {upNext.map((m) => (
            <UpNextRow key={m.id} milestone={m} onClick={() => goTo?.('timeline')} />
          ))}
        </Column>

        <Column
          label="In transit"
          sub={`${shipments.length} active ${shipments.length === 1 ? 'shipment' : 'shipments'}`}
          onSeeAll={() => goTo?.('arbitrage')}
          empty={shipments.length === 0}
          emptyText="Nothing in transit."
        >
          {shipments.map((c) => (
            <ShipmentRow key={c.id} cycle={c} onClick={() => goTo?.('arbitrage')} />
          ))}
        </Column>
      </section>

      {/* ═══════ This week ═══════ */}
      <section>
        <Headline label="This week" sub="Last 7 days, rolling" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--rule)] border border-[var(--rule)] stagger">
          <CompactCell label="Cycles added" value={week.cyclesAdded} accent="ink" />
          <CompactCell label="Cycles paid" value={week.cyclesPaid} accent="sage" />
          <CompactCell label="Workouts" value={week.workouts} accent="accent" />
          <CompactCell label="Profit added" value={fmtCurrency(week.profitDelta)} accent={week.profitDelta >= 0 ? 'sage' : 'clay'} />
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

function Headline({ label, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-5 pb-3 border-b border-[var(--rule)]">
      <div>
        <div className="page-eyebrow">{label}</div>
      </div>
      {sub && (
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)]">
          {sub}
        </div>
      )}
    </div>
  )
}

function CompactCell({ label, value, sub, accent = 'ink' }) {
  const dot = {
    ink:    'bg-[var(--ink-3)]',
    accent: 'bg-[var(--accent)]',
    sage:   'bg-sage-500',
    clay:   'bg-clay-500',
    steel:  'bg-steel-500',
  }[accent] || 'bg-[var(--ink-3)]'

  return (
    <div className="px-5 py-5 bg-[var(--paper-1)]">
      <div className="flex items-center gap-2">
        <span className={`w-1 h-1 rounded-full ${dot}`} />
        <div className="stat-label">{label}</div>
      </div>
      <div className="font-display text-[var(--ink-1)] mt-3 leading-none"
           style={{ fontWeight: 500, fontSize: '32px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div className="text-[12px] text-[var(--ink-3)] mt-2">{sub}</div>}
    </div>
  )
}

function Column({ label, sub, onSeeAll, empty, emptyText, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-[var(--rule)]">
        <div>
          <div className="page-eyebrow">{label}</div>
          {sub && <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] mt-1">{sub}</div>}
        </div>
        {onSeeAll && (
          <button className="btn btn-ghost text-xs" onClick={onSeeAll}>
            See all <ArrowRight size={11} strokeWidth={1.6} />
          </button>
        )}
      </div>
      {empty ? (
        <div className="text-sm text-[var(--ink-3)] py-6">
          {emptyText}
        </div>
      ) : <div className="space-y-px">{children}</div>}
    </section>
  )
}

function UpNextRow({ milestone, onClick }) {
  const m = milestone
  const dayLabel = m.days === 0 ? 'Today' : m.days < 0 ? `${Math.abs(m.days)}d overdue` : `${m.days}d`
  const tone = m.days < 0 ? 'clay' : m.days <= 7 ? 'accent' : 'ink'
  const toneCls = {
    clay:   'text-clay-500',
    accent: 'text-[var(--accent)]',
    ink:    'text-[var(--ink-2)]',
  }[tone]

  return (
    <button onClick={onClick} className="w-full text-left flex items-center gap-4 py-3 border-b border-[var(--rule)] hover:bg-[var(--paper-2)] -mx-2 px-2 transition-colors">
      <div className={`font-mono tabular-nums text-sm shrink-0 w-20 ${toneCls}`}>
        {dayLabel}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-[var(--ink-1)] truncate">{m.title}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--ink-3)] mt-0.5">
          {fmtDateShort(m.date)} · {m.category}
        </div>
      </div>
      <ArrowRight size={13} strokeWidth={1.4} className="text-[var(--ink-3)] shrink-0" />
    </button>
  )
}

function ShipmentRow({ cycle, onClick }) {
  const status = cycle.trackingStatus || 'In transit'
  return (
    <button onClick={onClick} className="w-full text-left flex items-center gap-4 py-3 border-b border-[var(--rule)] hover:bg-[var(--paper-2)] -mx-2 px-2 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-[var(--ink-1)]">
          {cycle.model} <span className="text-[var(--ink-3)]">× {cycle.quantity}</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--ink-3)] mt-0.5 truncate">
          {cycle.trackingNumber} · {status}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-3)]">Delivers</div>
        <div className="text-[12px] tabular-nums text-[var(--ink-1)] mt-0.5">
          {fmtDateShort(cycle.actualDelivery || cycle.expectedDelivery)}
        </div>
      </div>
    </button>
  )
}
