import { useMemo, useState } from 'react'
import {
  Pencil, Trash2, ExternalLink, RefreshCw, Truck, Smartphone,
  ArrowRight, CalendarClock, Plus, Package, Search, X, Copy,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { fmtCurrency, fmtDateShort, expectedPayout, netProfit, totalCost } from '../../lib/calc'
import { CYCLE_STATUSES } from '../../lib/defaults'
import { detectCarrier, trackingUrl, statusTone, shortStatus } from '../../lib/tracking'
import { useAppData } from '../../lib/AppData'

const STATUS_STYLES = {
  Ordered:   { label: 'Ordered',   bar: 'bg-slate-400',   pill: 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-200 ring-1 ring-slate-200 dark:ring-white/10' },
  Shipped:   { label: 'Shipped',   bar: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/20' },
  Traded:    { label: 'Traded',    bar: 'bg-violet-500',  pill: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-500/20' },
  Submitted: { label: 'Submitted', bar: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-500/20' },
  Paid:      { label: 'Paid',      bar: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/20' },
}

const TONE_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-emerald-200/70 dark:ring-emerald-500/20',
  brand:   'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 ring-1 ring-brand-200/70 dark:ring-brand-500/20',
  amber:   'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-200/70 dark:ring-amber-500/20',
  rose:    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 ring-1 ring-rose-200/70 dark:ring-rose-500/20',
  slate:   'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 ring-1 ring-slate-200/70 dark:ring-white/10',
}

export default function CycleList({ cycles, onEdit, onDelete, onNew, onDuplicate, privacyCards }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cycles.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (!q) return true
      const haystack = [c.model, c.trackingNumber, c.carrier, c.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [cycles, statusFilter, search])

  const byStatus = useMemo(() => {
    const counts = { all: cycles.length }
    CYCLE_STATUSES.forEach((s) => { counts[s] = 0 })
    cycles.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1 })
    return counts
  }, [cycles])

  if (cycles.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={Package}
          title="No cycles yet"
          description="Log your first iPhone arbitrage cycle to start tracking costs, payouts, and profit."
          action={
            <button className="btn-primary" onClick={onNew}>
              <Plus size={15} /> New cycle
            </button>
          }
        />
      </div>
    )
  }

  const cardsById = Object.fromEntries(privacyCards.map((c) => [c.id, c]))

  return (
    <>
      {/* Toolbar: search + status filter chips */}
      <div className="card-padded mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9 pr-9 text-sm"
              placeholder="Search by model, tracking number, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost !p-1"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          <FilterChip
            label={`All`}
            count={byStatus.all}
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          {CYCLE_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={s}
              count={byStatus[s] || 0}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              tone={s}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try a different search term or status filter."
            action={
              <button className="btn-secondary" onClick={() => { setSearch(''); setStatusFilter('all') }}>
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 stagger">
          {filtered.map((c) => (
            <CycleCard
              key={c.id}
              cycle={c}
              card={c.cardId ? cardsById[c.cardId] : null}
              onEdit={() => onEdit(c)}
              onDelete={() => onDelete(c)}
              onDuplicate={() => onDuplicate?.(c)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function FilterChip({ label, count, active, onClick, tone }) {
  const toneCls = !active && tone ? STATUS_STYLES[tone]?.pill : ''
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition
        ${active
          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft'
          : `${toneCls || 'bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300'} hover:opacity-80`
        }`}
    >
      {label}
      <span className={`tabular-nums px-1.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-white/60 dark:bg-white/[0.08]'}`}>
        {count}
      </span>
    </button>
  )
}

function CycleCard({ cycle, card, onEdit, onDelete, onDuplicate }) {
  const cost = totalCost(cycle)
  const expected = expectedPayout(cycle)
  const net = netProfit(cycle)
  const status = STATUS_STYLES[cycle.status] || STATUS_STYLES.Ordered
  const isActualDelivery = !!cycle.actualDelivery
  const deliveryDate = cycle.actualDelivery || cycle.expectedDelivery

  return (
    <div className="card overflow-hidden card-hover">
      {/* status bar */}
      <div className={`h-1 w-full ${status.bar}`} />

      <div className="p-4 sm:p-5">
        {/* header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="icon-tile bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 shrink-0">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-slate-900 dark:text-white text-[15px] truncate">
                  {cycle.model}
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  × {cycle.quantity}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <CalendarClock size={11} />
                {fmtDateShort(cycle.orderDate)}
                <ArrowRight size={11} />
                <span className={isActualDelivery ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                  {fmtDateShort(deliveryDate)}{isActualDelivery && ' ✓'}
                </span>
              </div>
            </div>
          </div>
          <span className={`badge ${status.pill}`}>{status.label}</span>
        </div>

        {/* numbers */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <NumTile label="Cost" value={fmtCurrency(cost)} />
          <NumTile label="Expected" value={fmtCurrency(expected)} />
          <NumTile
            label="Net"
            value={fmtCurrency(net)}
            tone={net >= 0 ? 'emerald' : 'rose'}
          />
        </div>

        {/* meta line */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Trade {fmtCurrency(cycle.tradeInValue)} · CC {(Number(cycle.cardCashRate) * 100).toFixed(0)}%
          </span>
          {card && (
            <span className="truncate ml-2">
              💳 {card.nickname}{card.last4 ? ` ····${card.last4}` : ''}
            </span>
          )}
        </div>

        {/* tracking */}
        <TrackingRow cycle={cycle} />

        {/* actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {cycle.notes ? '📝 Has notes' : ' '}
          </span>
          <div className="flex items-center gap-1">
            {onDuplicate && (
              <button className="btn-ghost !p-1.5" onClick={onDuplicate} aria-label="Duplicate cycle" title="Duplicate">
                <Copy size={14} />
              </button>
            )}
            <button className="btn-ghost !p-1.5" onClick={onEdit} aria-label="Edit cycle">
              <Pencil size={14} />
            </button>
            <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={onDelete} aria-label="Delete cycle">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NumTile({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
  }
  return (
    <div className={`rounded-lg px-2 py-2.5 ${tones[tone] || tones.slate}`}>
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</div>
      <div className="text-[15px] font-bold tabular-nums mt-0.5 truncate">{value}</div>
    </div>
  )
}

function TrackingRow({ cycle }) {
  const { settings, refreshTracking, showToast } = useAppData()
  const [busy, setBusy] = useState(false)

  if (!cycle.trackingNumber) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-slate-200 dark:border-white/[0.06]
                      px-3 py-2.5 text-[12px] text-slate-400 dark:text-slate-500
                      flex items-center gap-2">
        <Truck size={13} /> No tracking number
      </div>
    )
  }

  const carrier = cycle.carrier || detectCarrier(cycle.trackingNumber)
  const url = trackingUrl(cycle.trackingNumber, carrier)
  const label = shortStatus(cycle.trackingStatus, cycle.trackingCode)
  const tone = statusTone(cycle.trackingCode, cycle.trackingStatus)

  const handleRefresh = async () => {
    if (!settings.trackingProxyUrl) {
      showToast({
        type: 'error',
        title: 'Tracking API not configured',
        message: 'Open Settings → Tracking API and paste your proxy URL.',
      })
      return
    }
    setBusy(true)
    try {
      const { cycle: updated } = await refreshTracking(cycle.id)
      showToast({
        type: 'success',
        title: 'Tracking refreshed',
        message: updated.trackingStatus || 'Updated',
      })
    } catch (err) {
      showToast({ type: 'error', title: 'Tracking failed', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-slate-50 dark:bg-white/[0.03]
                    border border-slate-200/70 dark:border-white/[0.05]
                    px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Truck size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              {carrier}
            </span>
            {label && <span className={`badge ${TONE_STYLES[tone] || TONE_STYLES.slate}`}>{label}</span>}
          </div>
          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate" title={cycle.trackingNumber}>
            {cycle.trackingNumber}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost !p-1.5"
            aria-label={`Open in ${carrier} site`}
            title={`Open in ${carrier} tracking`}
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={handleRefresh}
            disabled={busy}
            className="btn-ghost !p-1.5"
            aria-label="Refresh tracking"
            title={settings.trackingProxyUrl ? 'Refresh live status' : 'Configure proxy URL in Settings'}
          >
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  )
}
