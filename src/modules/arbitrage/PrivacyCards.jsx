import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Confirm from '../../components/ui/Confirm'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { CARD_STATUSES, PRIVACY_MONTHLY_LIMIT, PRIVACY_USES_PER_CARD } from '../../lib/defaults'
import { cardUsesRemaining, cardsUsedThisMonth } from '../../lib/calc'
import { format } from 'date-fns'

const STATUS_STYLES = {
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Maxed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Burned: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
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

  const save = (card) => {
    if (card.id) {
      setPrivacyCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
    } else {
      setPrivacyCards((prev) => [...prev, { ...card, id: uid() }])
    }
  }

  const remove = (card) => {
    setPrivacyCards((prev) => prev.filter((c) => c.id !== card.id))
  }

  return (
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="section-title">Privacy cards</h3>
          <p className="section-sub">Track which virtual card you used and burn rate.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">This month</div>
            <div className="font-semibold tabular-nums">
              <span className={usedThisMonth >= PRIVACY_MONTHLY_LIMIT ? 'text-rose-600 dark:text-rose-400' : ''}>
                {usedThisMonth}
              </span>
              <span className="text-slate-400 dark:text-slate-500"> / {PRIVACY_MONTHLY_LIMIT}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setEditing(empty())}>
            <Plus size={16} /> New card
          </button>
        </div>
      </div>

      {privacyCards.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
          No privacy cards tracked yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {privacyCards.map((card) => {
            const remaining = cardUsesRemaining(card, cycles)
            const used = PRIVACY_USES_PER_CARD - remaining
            return (
              <div key={card.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 text-white flex items-center justify-center shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{card.nickname || 'Untitled'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{card.monthCreated}</div>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_STYLES[card.status]}`}>{card.status}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Uses remaining</span>
                    <span className="tabular-nums font-medium">{remaining} / {PRIVACY_USES_PER_CARD}</span>
                  </div>
                  <div className="progress">
                    <div
                      className={`progress-bar ${remaining === 0 ? 'bg-rose-500' : remaining === 1 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(used / PRIVACY_USES_PER_CARD) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-3">
                  <button className="btn-ghost !p-1.5" onClick={() => setEditing(card)} aria-label="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => setConfirmDelete(card)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
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
    </div>
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
      title={initial?.id ? 'Edit privacy card' : 'New privacy card'}
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
