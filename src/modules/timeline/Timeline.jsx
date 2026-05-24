import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Pencil, Trash2, Calendar, Briefcase, Dumbbell as DumbbellIcon, Shield, Sparkles, Flag,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Confirm from '../../components/ui/Confirm'
import EmptyState from '../../components/ui/EmptyState'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { MILESTONE_CATEGORIES, MILESTONE_STATUSES } from '../../lib/defaults'
import { fmtDate, todayISO } from '../../lib/calc'
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns'

const CAT_STYLES = {
  Arbitrage: {
    icon: Briefcase,
    pill: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 ring-1 ring-brand-200/70 dark:ring-brand-500/20',
    dot:  'bg-gradient-to-br from-brand-400 to-brand-600',
  },
  Fitness: {
    icon: DumbbellIcon,
    pill: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 ring-1 ring-violet-200/70 dark:ring-violet-500/20',
    dot:  'bg-gradient-to-br from-violet-400 to-violet-600',
  },
  Military: {
    icon: Shield,
    pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-500/20',
    dot:  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  },
  Life: {
    icon: Sparkles,
    pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-500/20',
    dot:  'bg-gradient-to-br from-amber-400 to-amber-500',
  },
}

const STATUS_STYLES = {
  'Not started': 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 ring-1 ring-slate-200 dark:ring-white/10',
  'In progress': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-500/20',
  Done:          'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-500/20',
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
    <section>
      <SectionHeader
        icon={Calendar}
        accent="brand"
        eyebrow="Roadmap"
        title="Life timeline"
        sub="Big rocks from now through Lackland."
        actions={
          <button className="btn-primary" onClick={() => setEditing(empty())}>
            <Plus size={16} /> New milestone
          </button>
        }
      />

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState icon={Flag} title="No milestones" description="Add your first milestone to start the countdown." />
        </div>
      ) : (
        <div className="card-padded">
          <ol className="relative ml-2 border-l-2 border-dashed border-slate-200 dark:border-white/[0.08] space-y-5">
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
                <li key={m.id} className="ml-7 relative">
                  <span
                    className={`absolute -left-[40px] top-1 w-7 h-7 rounded-xl ring-4 ring-white dark:ring-slate-950
                                shadow-soft flex items-center justify-center ${cat.dot}`}
                  >
                    <Icon size={13} className="text-white" />
                  </span>
                  <div className="card-padded card-hover">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-base text-slate-900 dark:text-white">
                            {m.title || 'Untitled milestone'}
                          </h4>
                          <span className={`badge ${cat.pill}`}>{m.category}</span>
                          <button
                            className={`badge ${STATUS_STYLES[m.status]} cursor-pointer hover:opacity-80 transition`}
                            onClick={() => cycleStatus(m)}
                            title="Click to cycle status"
                          >
                            {m.status}
                          </button>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                          {fmtDate(m.date)}
                          <span className="mx-1.5 opacity-50">·</span>
                          {isDone ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Complete</span>
                          ) : days === null ? (
                            '—'
                          ) : days === 0 ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">Today</span>
                          ) : isPast ? (
                            <span className="text-rose-600 dark:text-rose-400">{Math.abs(days)} day{Math.abs(days) === 1 ? '' : 's'} overdue</span>
                          ) : (
                            <span>
                              <strong className="tabular-nums text-slate-700 dark:text-slate-200">{days}</strong> day{days === 1 ? '' : 's'} away
                            </span>
                          )}
                        </div>
                        {m.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">
                            {m.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost !p-1.5" onClick={() => setEditing(m)} aria-label="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => setConfirmDelete(m)} aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
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
    </section>
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
      eyebrow={initial?.id ? 'Edit milestone' : 'New milestone'}
      title={initial?.id ? form.title || 'Edit milestone' : 'New milestone'}
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
          <input type="date" className="input" value={form.date} onChange={(e) => update({ date: e.target.value })} />
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
          <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => update({ notes: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}
