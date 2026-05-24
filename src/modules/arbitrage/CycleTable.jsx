import { useState } from 'react'
import { Pencil, Trash2, ExternalLink, RefreshCw, Truck } from 'lucide-react'
import { fmtCurrency, fmtDateShort, expectedPayout, netProfit, totalCost } from '../../lib/calc'
import { detectCarrier, trackingUrl, statusTone, shortStatus } from '../../lib/tracking'
import { useAppData } from '../../lib/AppData'

const STATUS_STYLES = {
  Ordered: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Shipped: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Traded: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  Submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const TONE_STYLES = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  slate: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

export default function CycleTable({ cycles, onEdit, onDelete, privacyCards }) {
  if (cycles.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
        No cycles yet — add your first one to start tracking.
      </div>
    )
  }
  const cardsById = Object.fromEntries(privacyCards.map((c) => [c.id, c]))

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Qty</th>
            <th>Cost/u</th>
            <th>Trade</th>
            <th>Rate</th>
            <th>Order</th>
            <th>Delivery</th>
            <th>Tracking</th>
            <th>Status</th>
            <th>Card</th>
            <th>Cost</th>
            <th>Expected</th>
            <th>Net</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((c) => {
            const cost = totalCost(c)
            const expected = expectedPayout(c)
            const net = netProfit(c)
            const deliveryDate = c.actualDelivery || c.expectedDelivery
            const isActualDelivery = !!c.actualDelivery
            return (
              <tr key={c.id}>
                <td className="font-medium">{c.model}</td>
                <td className="tabular-nums">{c.quantity}</td>
                <td className="tabular-nums">{fmtCurrency(c.costPerUnit)}</td>
                <td className="tabular-nums">{fmtCurrency(c.tradeInValue)}</td>
                <td className="tabular-nums">{(Number(c.cardCashRate) * 100).toFixed(0)}%</td>
                <td>{fmtDateShort(c.orderDate)}</td>
                <td>
                  <span className={isActualDelivery ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    {fmtDateShort(deliveryDate)}
                  </span>
                  {isActualDelivery && <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400">✓</span>}
                </td>
                <td>
                  <TrackingCell cycle={c} />
                </td>
                <td>
                  <span className={`badge ${STATUS_STYLES[c.status] || STATUS_STYLES.Ordered}`}>{c.status}</span>
                </td>
                <td className="text-xs text-slate-500 dark:text-slate-400">
                  {c.cardId ? (cardsById[c.cardId]?.nickname || '—') : '—'}
                </td>
                <td className="tabular-nums">{fmtCurrency(cost)}</td>
                <td className="tabular-nums">{fmtCurrency(expected)}</td>
                <td className={`tabular-nums font-medium ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {fmtCurrency(net)}
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button className="btn-ghost !p-1.5" onClick={() => onEdit(c)} aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => onDelete(c)} aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TrackingCell({ cycle }) {
  const { settings, refreshTracking, showToast } = useAppData()
  const [busy, setBusy] = useState(false)

  if (!cycle.trackingNumber) {
    return <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
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
    <div className="flex items-center gap-2 min-w-0">
      <Truck size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
      <div className="min-w-0">
        <div className="font-mono text-[11px] truncate max-w-[140px]" title={cycle.trackingNumber}>
          {cycle.trackingNumber}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{carrier}</span>
          {label && <span className={`badge text-[10px] ${TONE_STYLES[tone] || TONE_STYLES.slate}`}>{label}</span>}
        </div>
      </div>
      <div className="flex items-center gap-0.5 ml-auto">
        <a href={url} target="_blank" rel="noreferrer" className="btn-ghost !p-1" aria-label="Open in carrier site">
          <ExternalLink size={13} />
        </a>
        <button
          onClick={handleRefresh}
          disabled={busy}
          className="btn-ghost !p-1"
          aria-label="Refresh tracking"
          title={settings.trackingProxyUrl ? 'Refresh live status' : 'Configure proxy URL in Settings'}
        >
          <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  )
}
