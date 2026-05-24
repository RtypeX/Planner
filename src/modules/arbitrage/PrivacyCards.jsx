import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Pencil, Trash2, CreditCard, Wifi, FileText, DollarSign,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import SectionHeader from '../../components/ui/SectionHeader'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import {
  CARD_STATUSES, CARD_TYPES, CARD_COLORS,
  PRIVACY_MONTHLY_LIMIT, PRIVACY_USES_PER_CARD,
} from '../../lib/defaults'
import { cardUsesRemaining, cardsUsedThisMonth, fmtCurrency, totalCost } from '../../lib/calc'
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
  last4: '',
  cardType: 'Visa',
  color: 'violet',
  notes: '',
  spendLimit: '',
})

/** How much has been spent on this card across all cycles. */
function spentOnCard(cardId, cycles) {
  return cycles
    .filter((c) => c.cardId === cardId)
    .reduce((sum, c) => sum + totalCost(c), 0)
}

function gradientFor(color) {
  return (CARD_COLORS.find((c) => c.id === color) || CARD_COLORS[0]).gradient
}

export default function PrivacyCards() {
  const { privacyCards, setPrivacyCards, cycles, undoableDelete } = useAppData()
  const [editing, setEditing] = useState(null)

  const usedThisMonth = cardsUsedThisMonth(cycles)
  const monthPct = Math.min(100, (usedThisMonth / PRIVACY_MONTHLY_LIMIT) * 100)

  const save = (card) => {
    if (card.id) setPrivacyCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
    else setPrivacyCards((prev) => [...prev, { ...card, id: uid() }])
  }
  const remove = (card) => {
    undoableDelete({
      label: `Card "${card.nickname}"`,
      perform: () => setPrivacyCards((prev) => prev.filter((c) => c.id !== card.id)),
      restore: () => setPrivacyCards((prev) => [...prev, card]),
    })
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger">
          {privacyCards.map((card) => {
            const remaining = cardUsesRemaining(card, cycles)
            const used = PRIVACY_USES_PER_CARD - remaining
            const spent = spentOnCard(card.id, cycles)
            return (
              <PrivacyCardTile
                key={card.id}
                card={card}
                remaining={remaining}
                used={used}
                spent={spent}
                onEdit={() => setEditing(card)}
                onDelete={() => remove(card)}
              />
            )
          })}
        </div>
      )}

      <CardForm open={!!editing} initial={editing} onClose={() => setEditing(null)} onSave={save} />
    </section>
  )
}

function PrivacyCardTile({ card, remaining, used, spent, onEdit, onDelete }) {
  const last4 = (card.last4 || '').toString().slice(-4).padStart(4, '•')
  const limit = Number(card.spendLimit || 0)
  const limitPct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0

  return (
    <div className="card overflow-hidden card-hover group">
      {/* Card-front face */}
      <div className={`relative bg-gradient-to-br ${gradientFor(card.color)} text-white p-4 pb-5`}>
        {/* Decorative bubbles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Wifi size={16} className="rotate-90 opacity-90" />
            <div className="font-bold tracking-tight truncate">{card.nickname || 'Untitled'}</div>
          </div>
          <span className={`badge ${STATUS_STYLES[card.status]}`}>{card.status}</span>
        </div>

        <div className="relative font-mono text-base sm:text-lg tracking-[0.2em] mt-4 opacity-90">
          •••• •••• •••• <span className="text-white">{last4}</span>
        </div>

        <div className="relative flex items-end justify-between mt-3 text-[11px]">
          <div className="opacity-80">
            <div className="opacity-70 text-[9px] uppercase tracking-wider">Created</div>
            <div className="font-mono">{card.monthCreated}</div>
          </div>
          <BrandBadge type={card.cardType} />
        </div>
      </div>

      {/* Card-back: stats + actions */}
      <div className="p-3 space-y-3">
        {/* Uses remaining */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Uses</span>
            <span className="tabular-nums">{used} / {PRIVACY_USES_PER_CARD}</span>
          </div>
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
        </div>

        {/* Spend tracker */}
        {limit > 0 && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={10} /> Spent
              </span>
              <span className="tabular-nums">{fmtCurrency(spent)} / {fmtCurrency(limit)}</span>
            </div>
            <ProgressBar
              value={spent}
              max={limit}
              color={limitPct >= 100 ? 'rose' : limitPct >= 80 ? 'amber' : 'brand'}
              showPct={false}
              size="sm"
            />
          </div>
        )}
        {limit === 0 && spent > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
              <DollarSign size={10} /> Spent
            </span>
            <span className="tabular-nums font-semibold">{fmtCurrency(spent)}</span>
          </div>
        )}

        {/* Notes preview */}
        {card.notes && (
          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <FileText size={11} className="mt-0.5 shrink-0 opacity-70" />
            <span className="line-clamp-2">{card.notes}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.04]">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {card.cardType || '—'}
          </span>
          <div className="flex gap-0.5">
            <button className="btn-ghost !p-1.5" onClick={onEdit} aria-label="Edit">
              <Pencil size={13} />
            </button>
            <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={onDelete} aria-label="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandBadge({ type }) {
  if (!type || type === 'Other') return null
  const styles = {
    Visa:       { label: 'VISA',       cls: 'italic font-black tracking-wider' },
    Mastercard: { label: 'mastercard', cls: 'lowercase font-bold tracking-wide' },
    Amex:       { label: 'AMEX',       cls: 'font-extrabold tracking-widest' },
    Discover:   { label: 'DISCOVER',   cls: 'font-bold tracking-wider' },
  }
  const s = styles[type] || { label: type.toUpperCase(), cls: 'font-bold' }
  return (
    <span className={`px-2 py-0.5 rounded bg-white/15 ring-1 ring-white/20 backdrop-blur text-[10px] ${s.cls}`}>
      {s.label}
    </span>
  )
}

function CardForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty())

  useEffect(() => {
    if (open) setForm(initial?.id ? { ...empty(), ...initial } : empty())
  }, [open, initial])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  // Sanitize last4 input: digits only, max 4 chars.
  const onLast4 = (v) => update({ last4: (v || '').replace(/\D/g, '').slice(0, 4) })

  // Live preview values for the mock card front
  const previewLast4 = (form.last4 || '').slice(-4).padStart(4, '•')

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={initial?.id ? 'Edit card' : 'New card'}
      title={initial?.id ? form.nickname || 'Edit privacy card' : 'New privacy card'}
      size="lg"
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
      {/* Live preview */}
      <div className={`relative rounded-2xl bg-gradient-to-br ${gradientFor(form.color)} text-white p-5 mb-5 overflow-hidden shadow-soft-lg`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Wifi size={16} className="rotate-90 opacity-90" />
            <div className="font-bold tracking-tight truncate">{form.nickname || 'Card preview'}</div>
          </div>
          <span className={`badge ${STATUS_STYLES[form.status] || ''}`}>{form.status}</span>
        </div>
        <div className="relative font-mono text-lg tracking-[0.2em] mt-5">
          •••• •••• •••• <span>{previewLast4}</span>
        </div>
        <div className="relative flex items-end justify-between mt-4 text-[11px]">
          <div className="opacity-80">
            <div className="opacity-70 text-[9px] uppercase tracking-wider">Created</div>
            <div className="font-mono">{form.monthCreated}</div>
          </div>
          <BrandBadge type={form.cardType} />
        </div>
      </div>

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
          <label className="label">Last 4 digits</label>
          <input
            className="input font-mono tracking-[0.3em] text-center"
            placeholder="1234"
            inputMode="numeric"
            maxLength={4}
            value={form.last4 || ''}
            onChange={(e) => onLast4(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Just the last 4 — never the full PAN.
          </p>
        </div>
        <div>
          <label className="label">Card type</label>
          <select className="input" value={form.cardType} onChange={(e) => update({ cardType: e.target.value })}>
            {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
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

        <div className="sm:col-span-2">
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update({ color: c.id })}
                className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient}
                            ring-2 transition-all
                            ${form.color === c.id
                              ? 'ring-slate-900 dark:ring-white scale-110'
                              : 'ring-transparent hover:scale-105'}`}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="label">Spend limit (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input pl-7"
              placeholder="—"
              value={form.spendLimit ?? ''}
              onChange={(e) => update({ spendLimit: e.target.value })}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Notes (optional)</label>
          <textarea
            className="input min-h-[60px]"
            placeholder="Funding source, why burned, etc."
            value={form.notes || ''}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}
