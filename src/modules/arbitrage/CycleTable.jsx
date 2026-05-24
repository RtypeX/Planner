import { Pencil, Trash2 } from 'lucide-react'
import { fmtCurrency, fmtDateShort, expectedPayout, netProfit, totalCost } from '../../lib/calc'

const STATUS_STYLES = {
  Ordered: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Shipped: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Traded: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  Submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
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
            <th>MobileX</th>
            <th>Trade</th>
            <th>Rate</th>
            <th>Order</th>
            <th>Delivery</th>
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
            return (
              <tr key={c.id}>
                <td className="font-medium">{c.model}</td>
                <td className="tabular-nums">{c.quantity}</td>
                <td className="tabular-nums">{fmtCurrency(c.costPerUnit)}</td>
                <td className="tabular-nums">{fmtCurrency(c.mobileXCost)}</td>
                <td className="tabular-nums">{fmtCurrency(c.tradeInValue)}</td>
                <td className="tabular-nums">{(Number(c.cardCashRate) * 100).toFixed(0)}%</td>
                <td>{fmtDateShort(c.orderDate)}</td>
                <td>{fmtDateShort(c.expectedDelivery)}</td>
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
