import { Activity, Timer, Dumbbell as DumbbellIcon, Target } from 'lucide-react'
import { useAppData } from '../../lib/AppData'
import { BMT_TARGETS } from '../../lib/defaults'
import { secondsToMmss, mmssToSeconds } from '../../lib/calc'

export default function BmtStandards() {
  const { fitnessBaselines, setFitnessBaselines, workouts } = useAppData()

  // best-of from workout log
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

  return (
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2"><Target size={18} /> BMT standards</h3>
          <p className="section-sub">USAF Basic Military Training fitness benchmarks (male, 17–29).</p>
        </div>
        <span className="badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
          Goal: pass + competitive scores
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RunStandard
          current={currentRun}
          targetSecs={BMT_TARGETS.runSeconds}
          onChange={(secs) => update({ runSeconds: secs })}
        />
        <CountStandard
          icon={DumbbellIcon}
          label="Push-ups (1 min)"
          current={currentPush}
          minPass={BMT_TARGETS.pushupsMin}
          goal={BMT_TARGETS.pushupsGoal}
          onChange={(n) => update({ pushups: n })}
          color="violet"
        />
        <CountStandard
          icon={Activity}
          label="Sit-ups (1 min)"
          current={currentSit}
          minPass={BMT_TARGETS.situpsMin}
          goal={BMT_TARGETS.situpsGoal}
          onChange={(n) => update({ situps: n })}
          color="amber"
        />
      </div>

      <div className="mt-4">
        <label className="label">Body weight (optional, lbs)</label>
        <input
          type="number"
          step="0.1"
          className="input max-w-xs"
          value={fitnessBaselines.weight ?? ''}
          placeholder="—"
          onChange={(e) => update({ weight: e.target.value === '' ? null : parseFloat(e.target.value) })}
        />
      </div>
    </div>
  )
}

function RunStandard({ current, targetSecs, onChange }) {
  const pct = current ? Math.max(0, Math.min(100, (targetSecs / current) * 100)) : 0
  const passing = current && current <= targetSecs
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg p-1.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
          <Timer size={16} />
        </div>
        <div className="font-semibold text-sm">1.5 mile run</div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tabular-nums">
          {current ? secondsToMmss(current) : '—'}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">target {secondsToMmss(targetSecs)}</span>
      </div>
      <div className="progress mb-2">
        <div
          className={`progress-bar ${passing ? 'bg-emerald-500' : 'bg-brand-500'}`}
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
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        {passing ? '✓ Passing' : current ? `${secondsToMmss(current - targetSecs)} to goal` : 'Set baseline'}
      </p>
    </div>
  )
}

function CountStandard({ icon: Icon, label, current, minPass, goal, onChange, color = 'violet' }) {
  const colorMap = {
    violet: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', bar: 'bg-violet-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
    brand: { bg: 'bg-brand-100 dark:bg-brand-900/40', text: 'text-brand-700 dark:text-brand-300', bar: 'bg-brand-500' },
  }
  const c = colorMap[color] || colorMap.violet
  const pct = Math.max(0, Math.min(100, (Number(current || 0) / goal) * 100))
  const passing = current >= minPass
  const ace = current >= goal
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 mb-2">
        <div className={`rounded-lg p-1.5 ${c.bg} ${c.text}`}>
          <Icon size={16} />
        </div>
        <div className="font-semibold text-sm">{label}</div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tabular-nums">{current ?? '—'}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">min {minPass} · goal {goal}</span>
      </div>
      <div className="relative progress mb-2">
        <div className={`progress-bar ${ace ? 'bg-emerald-500' : c.bar}`} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-700 dark:bg-slate-300"
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
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        {ace ? '✓ Goal hit' : passing ? '✓ Passing' : current ? `${minPass - current} to passing` : 'Set baseline'}
      </p>
    </div>
  )
}
