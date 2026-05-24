import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ListChecks, Activity } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Confirm from '../../components/ui/Confirm'
import EmptyState from '../../components/ui/EmptyState'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { WORKOUT_TYPES } from '../../lib/defaults'
import { fmtDateShort, mmssToSeconds, secondsToMmss, todayISO } from '../../lib/calc'

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
  const { workouts, setWorkouts } = useAppData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1))

  const save = (w) => {
    if (w.id) setWorkouts((prev) => prev.map((x) => (x.id === w.id ? w : x)))
    else setWorkouts((prev) => [...prev, { ...w, id: uid() }])
  }
  const remove = (w) => setWorkouts((prev) => prev.filter((x) => x.id !== w.id))

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
                {sorted.map((w) => (
                  <tr key={w.id}>
                    <td className="font-medium">{fmtDateShort(w.date)}</td>
                    <td>
                      <span className={`badge ${TYPE_STYLES[w.type] || ''}`}>{w.type}</span>
                    </td>
                    <td className="tabular-nums">{w.runDistance ? `${w.runDistance} mi` : '—'}</td>
                    <td className="tabular-nums">{w.runSeconds ? secondsToMmss(w.runSeconds) : '—'}</td>
                    <td className="tabular-nums">{w.pushups || '—'}</td>
                    <td className="tabular-nums">{w.situps || '—'}</td>
                    <td className="max-w-xs truncate text-slate-500 dark:text-slate-400">{w.notes || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button className="btn-ghost !p-1.5" onClick={() => setEditing(w)} aria-label="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => setConfirmDelete(w)} aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WorkoutForm open={editing !== null} initial={editing} onClose={() => setEditing(null)} onSave={save} />
      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        title="Delete workout?"
        message="Remove this entry from your log?"
        confirmLabel="Delete"
        danger
      />
    </section>
  )
}

function WorkoutForm({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(empty())
  const [runTimeStr, setRunTimeStr] = useState('')

  useEffect(() => {
    if (open) {
      const next = initial?.id ? { ...empty(), ...initial } : empty()
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
