import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, Briefcase, Dumbbell as DumbbellIcon, Shield, Sparkles } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Confirm from '../../components/ui/Confirm'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { MILESTONE_CATEGORIES, MILESTONE_STATUSES } from '../../lib/defaults'
import { fmtDate, todayISO } from '../../lib/calc'
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns'
const CAT_STYLES = {
  Arbitrage: { icon: Briefcase, color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300', dot: 'bg-brand-500' },
  Fitness: { icon: DumbbellIcon, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', dot: 'bg-violet-500' },
  Military: { icon: Shield, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Life: { icon: Sparkles, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
}
const STATUS_STYLES = {
  'Not started': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'In progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const empty = () => ({
  id: '',
  title: '',
  date: todayISO(),
  category: 'Life',
  status: 'Not started',
  notes: '',
})

export default function Timeline() {
  const { milestones, setMilestones } = useAppData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sorted = useMemo(
    () => [...milestones].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [milestones],
  )

  const save = (m) => {
    if (m.id) setMilestones((prev) => prev.map((x) => (x.id === m.id ? m : x)))
    else setMilestones((prev) => [...prev, { ...m, id: uid() }])
  }
  const remove = (m) => setMilestones((prev) => prev.filter((x) => x.id !== m.id))
  const cycleStatus = (m) => {
    const idx = MILESTONE_STATUSES.indexOf(m.status)
    const next = MILESTONE_STATUSES[(idx + 1) % MILESTONE_STATUSES.length]
    save({ ...m, status: next })
  }

  return (
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2"><Calendar size={18} /> Life timeline</h3>
          <p className="section-sub">Big rocks from now through BMT.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(empty())}>
          <Plus size={16} /> New milestone
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
          No milestones yet.
        </div>
      ) : (
        <ol className="relative ml-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-5">
          {sorted.map((m) => {
            const cat = CAT_STYLES[m.category] || CAT_STYLES.Life
            const Icon = cat.icon
            let days = null
            try {
              const d = parseISO(m.date)
              if (isValid(d)) days = differenceInCalendarDays(d, new Date())
            } catch {}
            const isPast = days !== null && days < 0
            const isDone = m.status === 'Done'
            return (
              <li key={m.id} className="ml-6 relative">
                <span
                  className={`absolute -left-[34px] top-1.5 w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 flex items-center justify-center ${cat.dot}`}
                >
                  <Icon size={11} className="text-white" />
                </span>
                <div className="card p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-base">{m.title || 'Untitled milestone'}</h4>
                        <span className={`badge ${cat.color}`}>{m.category}</span>
                        <button
                          className={`badge ${STATUS_STYLES[m.status]} cursor-pointer hover:opacity-80`}
                          onClick={() => cycleStatus(m)}
                          title="Click to cycle status"
                        >
                          {m.status}
                        </button>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {fmtDate(m.date)} ·{' '}
                        {isDone ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Complete</span>
                        ) : days === null ? (
                          '—'
                        ) : days === 0 ? (
                          <span className="font-medium">Today</span>
                        ) : isPast ? (
                          <span className="text-rose-600 dark:text-rose-400">{Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} overdue</span>
                        ) : (
                          <span><strong className="tabular-nums">{days}</strong> day{days === 1 ? '' : 's'} away</span>
                        )}
                      </div>
                      {m.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{m.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost !p-1.5" onClick={() => setEditing(m)} aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => setConfirmDelete(m)} aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <MilestoneForm open={editing !== null} initial={editing} onClose={() => setEditing(null)} onSave={save} />
      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        title="Delete milestone?"
        message={`Remove "${confirmDelete?.title}"?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

function MilestoneForm({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(empty())

  useEffect(() => {
    if (open) setForm(initial?.id ? { ...empty(), ...initial } : empty())
  }, [open, initial])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit milestone' : 'New milestone'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { onSave(form); onClose() }} disabled={!form.title.trim()}>
            Save milestone
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Take ASVAB practice test"
          />
        </div>
        <div>
          <label className="label">Target date</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => update({ category: e.target.value })}>
            {MILESTONE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => update({ status: e.target.value })}>
            {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[80px]"
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}
