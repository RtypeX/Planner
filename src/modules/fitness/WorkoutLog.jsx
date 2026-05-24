import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Confirm from '../../components/ui/Confirm'
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
  Run: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
  'Push-ups': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'Sit-ups': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Mixed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
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
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="section-title">Workout log</h3>
          <p className="section-sub">Every session, sortable by most recent.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(empty())}>
          <Plus size={16} /> Log workout
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
          No workouts logged yet.
        </div>
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
                  <td>{fmtDateShort(w.date)}</td>
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
                        <Pencil size={15} />
                      </button>
                      <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => setConfirmDelete(w)} aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
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
      title={initial?.id ? 'Edit workout' : 'Log workout'}
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
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => update({ type: e.target.value })}>
            {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Run distance (miles)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.runDistance}
            onChange={(e) => update({ runDistance: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Run time (mm:ss)</label>
          <input
            type="text"
            placeholder="13:36"
            className="input"
            value={runTimeStr}
            onChange={(e) => setRunTimeStr(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Push-ups</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.pushups}
            onChange={(e) => update({ pushups: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Sit-ups</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.situps}
            onChange={(e) => update({ situps: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[72px]"
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}
