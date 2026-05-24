import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, ListChecks, Activity, Dumbbell, Timer, Award, Zap } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { WORKOUT_TYPES } from '../../lib/defaults'
import { fmtDateShort, mmssToSeconds, secondsToMmss, todayISO } from '../../lib/calc'
import { isPersonalBest, getPersonalBests } from '../../lib/insights'

const empty = () => ({
  id: '',
  date: todayISO(),
  type: 'Run',
  runDistance: '',
  runSeconds: '',
  pushups: '',
  situps: '',
  notes: '',
})

const TYPE_STYLES = {
  Run:        'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 ring-1 ring-brand-200/70 dark:ring-brand-500/20',
  'Push-ups': 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 ring-1 ring-violet-200/70 dark:ring-violet-500/20',
  'Sit-ups':  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-500/20',
  Mixed:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-500/20',
}

export default function WorkoutLog() {
  const { workouts, setWorkouts, showToast, undoableDelete } = useAppData()
  const [editing, setEditing] = useState(null)

  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1))
  const pbs = useMemo(() => getPersonalBests(workouts), [workouts])

  // Listen for command-palette / hero "Log workout" actions
  useEffect(() => {
    const onLog = () => setEditing(empty())
    window.addEventListener('hq:log-workout', onLog)
    return () => window.removeEventListener('hq:log-workout', onLog)
  }, [])

  const save = (w) => {
    if (w.id) {
      setWorkouts((prev) => prev.map((x) => (x.id === w.id ? w : x)))
    } else {
      const newW = { ...w, id: uid() }
      setWorkouts((prev) => [...prev, newW])
      // Detect PB on the new workout against the rest of the log
      const pb = isPersonalBest(newW, workouts)
      if (pb.run || pb.pushups || pb.situps) {
        const labels = []
        if (pb.run) labels.push('run time')
        if (pb.pushups) labels.push('push-ups')
        if (pb.situps) labels.push('sit-ups')
        showToast({
          type: 'success',
          title: '🏆 New personal best!',
          message: `You beat your previous best ${labels.join(' & ')}.`,
        })
      }
    }
  }
  const remove = (w) => {
    undoableDelete({
      label: `Workout from ${w.date}`,
      perform: () => setWorkouts((prev) => prev.filter((x) => x.id !== w.id)),
      restore: () => setWorkouts((prev) => [...prev, w]),
    })
  }

  /** Quick-log helpers — open the form prefilled, user can adjust then save. */
  const quickRun = () => setEditing({ ...empty(), type: 'Run' })
  const quickPushups = () => setEditing({ ...empty(), type: 'Push-ups' })
  const quickSitups = () => setEditing({ ...empty(), type: 'Sit-ups' })

  /** One-tap log with no modal: copy your last value. Most useful once you have at least one entry. */
  const oneTapPushups = () => {
    if (!pbs.bestPushups) { quickPushups(); return }
    const last = [...workouts].reverse().find((w) => Number(w.pushups) > 0)
    const count = last ? Number(last.pushups) : pbs.bestPushups
    save({ ...empty(), type: 'Push-ups', pushups: count })
    showToast({ type: 'success', title: 'Logged', message: `${count} push-ups · just now` })
  }
  const oneTapSitups = () => {
    if (!pbs.bestSitups) { quickSitups(); return }
    const last = [...workouts].reverse().find((w) => Number(w.situps) > 0)
    const count = last ? Number(last.situps) : pbs.bestSitups
    save({ ...empty(), type: 'Sit-ups', situps: count })
    showToast({ type: 'success', title: 'Logged', message: `${count} sit-ups · just now` })
  }

  return (
    <section>
      <SectionHeader
        icon={ListChecks}
        accent="brand"
        eyebrow="Log"
        title="Workout history"
        sub="Every session, sortable by most recent."
        actions={
          <button className="btn-primary" onClick={() => setEditing(empty())}>
            <Plus size={16} /> Log workout
          </button>
        }
      />

      {/* Quick-log strip */}
      <div className="card-padded mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-brand-600 dark:text-brand-400" />
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200">
              Quick log
            </h4>
          </div>
          {workouts.length > 0 && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Last: {fmtDateShort(sorted[0]?.date)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickButton icon={Timer}    label="Run"        sub="Set time" onClick={quickRun}     accent="brand" />
          <QuickButton
            icon={Dumbbell}
            label="Push-ups"
            sub={pbs.bestPushups ? `Tap to log ${[...workouts].reverse().find((w) => Number(w.pushups) > 0)?.pushups || pbs.bestPushups}` : 'Set count'}
            onClick={oneTapPushups}
            accent="violet"
          />
          <QuickButton
            icon={Activity}
            label="Sit-ups"
            sub={pbs.bestSitups ? `Tap to log ${[...workouts].reverse().find((w) => Number(w.situps) > 0)?.situps || pbs.bestSitups}` : 'Set count'}
            onClick={oneTapSitups}
            accent="amber"
          />
          <QuickButton icon={ListChecks} label="Custom"   sub="Mixed session" onClick={() => setEditing(empty())} accent="emerald" />
        </div>
      </div>

      {/* Personal bests */}
      {(pbs.bestRunSeconds || pbs.bestPushups || pbs.bestSitups) && (
        <div className="card-padded mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={15} className="text-amber-500" />
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200">
              Personal bests
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <PbTile label="1.5 mi run" value={pbs.bestRunSeconds ? secondsToMmss(pbs.bestRunSeconds) : '—'} accent="brand" />
            <PbTile label="Push-ups"   value={pbs.bestPushups || '—'} accent="violet" />
            <PbTile label="Sit-ups"    value={pbs.bestSitups  || '—'} accent="amber" />
          </div>
        </div>
      )}

      <div className="card">
        {sorted.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No workouts yet"
            description="Log your first run, push-up set, or sit-up set to start the streak counter and progress charts."
            action={
              <button className="btn-primary" onClick={() => setEditing(empty())}>
                <Plus size={15} /> Log workout
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Run dist</th>
                  <th>Run time</th>
                  <th>Push-ups</th>
                  <th>Sit-ups</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((w) => {
                  const pb = isPersonalBest(w, workouts)
                  const isPb = pb.run || pb.pushups || pb.situps
                  return (
                    <tr key={w.id}>
                      <td className="font-medium">
                        {fmtDateShort(w.date)}
                        {isPb && (
                          <span title="Personal best on this day" className="ml-1.5 text-amber-500">🏆</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${TYPE_STYLES[w.type] || ''}`}>{w.type}</span>
                      </td>
                      <td className="tabular-nums">{w.runDistance ? `${w.runDistance} mi` : '—'}</td>
                      <td className={`tabular-nums ${pb.run ? 'font-bold text-amber-600 dark:text-amber-400' : ''}`}>
                        {w.runSeconds ? secondsToMmss(w.runSeconds) : '—'}
                      </td>
                      <td className={`tabular-nums ${pb.pushups ? 'font-bold text-amber-600 dark:text-amber-400' : ''}`}>
                        {w.pushups || '—'}
                      </td>
                      <td className={`tabular-nums ${pb.situps ? 'font-bold text-amber-600 dark:text-amber-400' : ''}`}>
                        {w.situps || '—'}
                      </td>
                      <td className="max-w-xs truncate text-slate-500 dark:text-slate-400">{w.notes || '—'}</td>
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          <button className="btn-ghost !p-1.5" onClick={() => setEditing(w)} aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => remove(w)} aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WorkoutForm open={editing !== null} initial={editing} onClose={() => setEditing(null)} onSave={save} />
    </section>
  )
}

function QuickButton({ icon: Icon, label, sub, onClick, accent = 'brand' }) {
  const accents = {
    brand:   'text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10',
    violet:  'text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10',
    amber:   'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
  }
  return (
    <button
      onClick={onClick}
      className="card card-hover p-3 flex items-center gap-3 text-left"
    >
      <div className={`icon-tile shrink-0 ${accents[accent] || accents.brand}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm text-slate-900 dark:text-white">{label}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{sub}</div>
      </div>
    </button>
  )
}

function PbTile({ label, value, accent = 'brand' }) {
  const tones = {
    brand:   'bg-brand-50 dark:bg-brand-500/10',
    violet:  'bg-violet-50 dark:bg-violet-500/10',
    amber:   'bg-amber-50 dark:bg-amber-500/10',
  }
  return (
    <div className={`rounded-xl p-3 ${tones[accent] || tones.brand}`}>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300 opacity-80">
        {label}
      </div>
      <div className="text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white mt-0.5">
        {value}
      </div>
    </div>
  )
}

function WorkoutForm({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(empty())
  const [runTimeStr, setRunTimeStr] = useState('')

  useEffect(() => {
    if (open) {
      const next = initial?.id ? { ...empty(), ...initial } : { ...empty(), ...(initial || {}) }
      setForm(next)
      setRunTimeStr(next.runSeconds ? secondsToMmss(next.runSeconds) : '')
    }
  }, [open, initial])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSave = () => {
    const out = {
      ...form,
      runSeconds: runTimeStr ? mmssToSeconds(runTimeStr) || '' : '',
      runDistance: form.runDistance === '' ? '' : Number(form.runDistance),
      pushups: form.pushups === '' ? '' : Number(form.pushups),
      situps: form.situps === '' ? '' : Number(form.situps),
    }
    onSave(out)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={initial?.id ? 'Edit workout' : 'Log workout'}
      title={initial?.id ? 'Edit session' : 'New workout'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => update({ date: e.target.value })} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => update({ type: e.target.value })}>
            {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Run distance (mi)</label>
          <input
            type="number" step="0.01" className="input"
            value={form.runDistance}
            onChange={(e) => update({ runDistance: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Run time (mm:ss)</label>
          <input
            type="text" placeholder="13:36" className="input"
            value={runTimeStr}
            onChange={(e) => setRunTimeStr(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Push-ups</label>
          <input type="number" min="0" className="input" value={form.pushups} onChange={(e) => update({ pushups: e.target.value })} />
        </div>
        <div>
          <label className="label">Sit-ups</label>
          <input type="number" min="0" className="input" value={form.situps} onChange={(e) => update({ situps: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea className="input min-h-[72px]" value={form.notes} onChange={(e) => update({ notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
