import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Confirm from '../../components/ui/Confirm'
import EmptyState from '../../components/ui/EmptyState'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { CARD_STATUSES, PRIVACY_MONTHLY_LIMIT, PRIVACY_USES_PER_CARD } from '../../lib/defaults'
import { cardUsesRemaining, cardsUsedThisMonth } from '../../lib/calc'
import { format } from 'date-fns'

const STATUS_STYLES = {
  Active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-500/20',
  Maxed:  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-500/20',
  Burned: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 ring-1 ring-rose-200/70 dark:ring-rose-500/20',
}

const empty = () => ({
  id: '',
  nickname: '',
  monthCreated: format(new Date(), 'yyyy-MM'),
  status: 'Active',
})

export default function PrivacyCards() {
  const { privacyCards, setPrivacyCards, cycles } = useAppData()
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const usedThisMonth = cardsUsedThisMonth(cycles)
  const monthPct = Math.min(100, (usedThisMonth / PRIVACY_MONTHLY_LIMIT) * 100)

  const save = (card) => {
    if (card.id) setPrivacyCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
    else setPrivacyCards((prev) => [...prev, { ...card, id: uid() }])
  }
  const remove = (card) => setPrivacyCards((prev) => prev.filter((c) => c.id !== card.id))

  return (
    <section>
      <SectionHeader
        icon={CreditCard}
        accent="violet"
        eyebrow="Cards"
        title="Privacy cards"
        sub={`${usedThisMonth} of ${PRIVACY_MONTHLY_LIMIT} cards used this month`}
        actions={
          <button className="btn-primary" onClick={() => setEditing(empty())}>
            <Plus size={16} /> New card
          </button>
        }
      />

      <div className="card-padded mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Monthly burn</span>
          <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
            {usedThisMonth} / {PRIVACY_MONTHLY_LIMIT}
          </span>
        </div>
        <div className="progress">
          <div
            className={`progress-bar bg-gradient-to-r ${
              monthPct >= 100 ? 'from-rose-400 to-rose-600'
              : monthPct >= 75 ? 'from-amber-400 to-amber-500'
              : 'from-violet-400 to-violet-600'
            }`}
            style={{ width: `${monthPct}%` }}
          />
        </div>
      </div>

      {privacyCards.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CreditCard}
            title="No privacy cards tracked"
            description="Add your virtual cards to track uses per card and monthly burn against the 12-card limit."
            action={
              <button className="btn-primary" onClick={() => setEditing(empty())}>
                <Plus size={15} /> Add a card
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {privacyCards.map((card) => {
            const remaining = cardUsesRemaining(card, cycles)
            const used = PRIVACY_USES_PER_CARD - remaining
            return (
              <div key={card.id} className="card overflow-hidden card-hover">
                {/* Card-style top */}
                <div className="relative bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 text-white p-4 pb-5">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CreditCard size={18} />
                      <div className="font-bold tracking-tight truncate">{card.nickname || 'Untitled'}</div>
                    </div>
                    <span className={`badge ${STATUS_STYLES[card.status]}`}>{card.status}</span>
                  </div>
                  <div className="relative font-mono text-sm tracking-wider mt-3 opacity-90">
                    •••• •••• •••• {String(remaining).padStart(4, '0')}
                  </div>
                  <div className="relative flex items-end justify-between mt-3 text-[11px] opacity-80">
                    <span>{card.monthCreated}</span>
                    <span>{remaining} uses left</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="progress h-1.5">
                    <div
                      className={`progress-bar bg-gradient-to-r ${
                        remaining === 0 ? 'from-rose-400 to-rose-600'
                        : remaining === 1 ? 'from-amber-400 to-amber-500'
                        : 'from-emerald-400 to-emerald-600'
                      }`}
                      style={{ width: `${(used / PRIVACY_USES_PER_CARD) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{used} / {PRIVACY_USES_PER_CARD} used</span>
                    <div className="flex gap-0.5">
                      <button className="btn-ghost !p-1.5" onClick={() => setEditing(card)} aria-label="Edit">
                        <Pencil size={13} />
                      </button>
                      <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => setConfirmDelete(card)} aria-label="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CardForm open={!!editing} initial={editing} onClose={() => setEditing(null)} onSave={save} />
      <Confirm
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        title="Delete card?"
        message={`Remove "${confirmDelete?.nickname}" from your privacy card list?`}
        confirmLabel="Delete"
        danger
      />
    </section>
  )
}

function CardForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty())

  useEffect(() => {
    if (open) setForm(initial?.id ? { ...initial } : empty())
  }, [open, initial])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={initial?.id ? 'Edit card' : 'New card'}
      title={initial?.id ? form.nickname || 'Edit privacy card' : 'New privacy card'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => { onSave(form); onClose() }}
            disabled={!form.nickname.trim()}
          >
            Save card
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nickname</label>
          <input
            className="input"
            placeholder="e.g. Privacy A"
            value={form.nickname}
            onChange={(e) => update({ nickname: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Month created</label>
          <input
            type="month"
            className="input"
            value={form.monthCreated}
            onChange={(e) => update({ monthCreated: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => update({ status: e.target.value })}>
            {CARD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
