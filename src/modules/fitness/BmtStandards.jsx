import { Activity, Timer, Dumbbell as DumbbellIcon, Target, Scale } from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAppData } from '../../lib/AppData'
import { BMT_TARGETS } from '../../lib/defaults'
import { secondsToMmss, mmssToSeconds } from '../../lib/calc'
import { useCountUp } from '../../lib/animation'

export default function BmtStandards() {
  const { fitnessBaselines, setFitnessBaselines, workouts } = useAppData()

  const bestRun = workouts
    .map((w) => Number(w.runSeconds || 0))
    .filter((s) => s > 0)
    .reduce((min, s) => (min === null ? s : Math.min(min, s)), null)
  const bestPushups = workouts.reduce((m, w) => Math.max(m, Number(w.pushups || 0)), 0)
  const bestSitups = workouts.reduce((m, w) => Math.max(m, Number(w.situps || 0)), 0)

  const currentRun = fitnessBaselines.runSeconds ?? bestRun ?? null
  const currentPush = fitnessBaselines.pushups ?? bestPushups ?? 0
  const currentSit = fitnessBaselines.situps ?? bestSitups ?? 0

  const update = (patch) => setFitnessBaselines({ ...fitnessBaselines, ...patch })

  // Overall readiness %
  const runScore = currentRun ? Math.min(100, (BMT_TARGETS.runSeconds / currentRun) * 100) : 0
  const pushScore = Math.min(100, (currentPush / BMT_TARGETS.pushupsGoal) * 100)
  const sitScore = Math.min(100, (currentSit / BMT_TARGETS.situpsGoal) * 100)
  const overall = Math.round((runScore + pushScore + sitScore) / 3)

  return (
    <section>
      <SectionHeader
        icon={Target}
        accent="emerald"
        eyebrow="Standards"
        title="BMT fitness benchmarks"
        sub="USAF Basic Military Training (male, 17–29). Click a tile to edit baseline."
      />

      {/* Overall readiness card */}
      <div className="card-padded mb-4 card-hover">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="stat-label">Overall readiness</div>
            <AnimatedReadinessNumber pct={overall} />
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Average across run, push-ups, sit-ups
            </div>
          </div>
          <ReadinessRing pct={overall} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 stagger">
        <RunStandard
          current={currentRun}
          targetSecs={BMT_TARGETS.runSeconds}
          onChange={(secs) => update({ runSeconds: secs })}
        />
        <CountStandard
          icon={DumbbellIcon}
          label="Push-ups"
          unit="(1 min)"
          current={currentPush}
          minPass={BMT_TARGETS.pushupsMin}
          goal={BMT_TARGETS.pushupsGoal}
          onChange={(n) => update({ pushups: n })}
          color="violet"
        />
        <CountStandard
          icon={Activity}
          label="Sit-ups"
          unit="(1 min)"
          current={currentSit}
          minPass={BMT_TARGETS.situpsMin}
          goal={BMT_TARGETS.situpsGoal}
          onChange={(n) => update({ situps: n })}
          color="amber"
        />
      </div>

      <div className="card-padded mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={14} className="text-slate-500 dark:text-slate-400" />
          <label className="label !mb-0">Body weight (lbs, optional)</label>
        </div>
        <input
          type="number"
          step="0.1"
          className="input max-w-xs"
          value={fitnessBaselines.weight ?? ''}
          placeholder="—"
          onChange={(e) => update({ weight: e.target.value === '' ? null : parseFloat(e.target.value) })}
        />
      </div>
    </section>
  )
}

function AnimatedReadinessNumber({ pct }) {
  const v = useCountUp(pct, { duration: 1100 })
  return (
    <div className="text-3xl font-extrabold tabular-nums mt-1 text-slate-900 dark:text-white">
      {Math.round(v)}%
    </div>
  )
}

function ReadinessRing({ pct }) {
  const animPct = useCountUp(pct, { duration: 1100, decimals: 0 })
  const r = 28
  const C = 2 * Math.PI * r
  const dash = (animPct / 100) * C
  const color = animPct >= 100 ? '#10b981' : animPct >= 70 ? '#22c55e' : animPct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-my-2">
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-white/[0.08]" />
      <circle
        cx="40" cy="40" r={r} fill="none" strokeWidth="6"
        stroke={color}
        strokeDasharray={`${dash} ${C}`}
        strokeDashoffset={C / 4}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
      />
      <text x="40" y="44" textAnchor="middle" className="fill-slate-900 dark:fill-white font-extrabold text-sm tabular-nums">
        {Math.round(animPct)}%
      </text>
    </svg>
  )
}

function RunStandard({ current, targetSecs, onChange }) {
  const pct = current ? Math.max(0, Math.min(100, (targetSecs / current) * 100)) : 0
  const passing = current && current <= targetSecs
  return (
    <div className="card-padded card-hover">
      <div className="flex items-center gap-2 mb-3">
        <div className="icon-tile bg-sky-500/15 text-sky-300">
          <Timer size={16} />
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-900 dark:text-white">1.5 mile run</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">target {secondsToMmss(targetSecs)}</div>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-[var(--label-1)]">
          {current ? secondsToMmss(current) : '—'}
        </span>
        {passing && (
          <span className="badge bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            ✓ Passing
          </span>
        )}
      </div>
      <div className="progress mb-3">
        <div
          className={`progress-bar bg-gradient-to-r ${passing ? 'from-emerald-400 to-emerald-600' : 'from-brand-400 to-brand-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="text"
        className="input text-sm"
        placeholder="mm:ss"
        value={current ? secondsToMmss(current) : ''}
        onChange={(e) => onChange(mmssToSeconds(e.target.value))}
      />
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
        {passing ? 'Above standard' : current ? `${secondsToMmss(current - targetSecs)} to goal` : 'Set a baseline time'}
      </p>
    </div>
  )
}

function CountStandard({ icon: Icon, label, unit, current, minPass, goal, onChange, color = 'violet' }) {
  const colorMap = {
    violet: { tile: 'bg-violet-500/15 text-violet-300', bar: 'from-violet-400 to-violet-600' },
    amber:  { tile: 'bg-amber-500/15 text-amber-300',   bar: 'from-amber-400 to-amber-500' },
    brand:  { tile: 'bg-sky-500/15 text-sky-300',       bar: 'from-sky-400 to-blue-600' },
  }
  const c = colorMap[color] || colorMap.violet
  const pct = Math.max(0, Math.min(100, (Number(current || 0) / goal) * 100))
  const passing = current >= minPass
  const ace = current >= goal
  return (
    <div className="card-padded card-hover">
      <div className="flex items-center gap-2 mb-3">
        <div className={`icon-tile ${c.tile}`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-900 dark:text-white">{label}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">min {minPass} · goal {goal} {unit}</div>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-[var(--label-1)]">
          {current ?? '—'}
        </span>
        {ace && (
          <span className="badge bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            ✓ Goal hit
          </span>
        )}
        {!ace && passing && (
          <span className="badge bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            ✓ Passing
          </span>
        )}
      </div>
      <div className="relative progress mb-3">
        <div className={`progress-bar bg-gradient-to-r ${ace ? 'from-emerald-400 to-emerald-600' : c.bar}`} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-700 dark:bg-white/40"
          style={{ left: `${(minPass / goal) * 100}%` }}
          title={`Min ${minPass}`}
        />
      </div>
      <input
        type="number"
        min="0"
        className="input text-sm"
        placeholder="0"
        value={current ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
      />
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
        {ace ? 'Above standard' : passing ? `${goal - current} to goal` : current ? `${minPass - current} to passing` : 'Set a baseline count'}
      </p>
    </div>
  )
}
