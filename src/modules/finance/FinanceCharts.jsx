import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts'
import { useAppData } from '../../lib/AppData'
import { fmtCurrency, netProfit } from '../../lib/calc'
import { format, parseISO } from 'date-fns'

export default function FinanceCharts() {
  const { cycles, balance, settings } = useAppData()
  const isDark = settings.theme === 'dark'
  const grid = isDark ? '#334155' : '#e2e8f0'
  const text = isDark ? '#94a3b8' : '#64748b'

  // Profit per cycle, ordered by orderDate then quantity
  const profitData = useMemo(
    () =>
      [...cycles]
        .filter((c) => c.orderDate)
        .sort((a, b) => (a.orderDate < b.orderDate ? -1 : 1))
        .map((c, i) => ({
          name: `#${i + 1}`,
          date: c.orderDate,
          model: c.model,
          profit: Math.round(netProfit(c)),
        })),
    [cycles],
  )

  // Cumulative net worth = liquidCash + personalSavings + cumulative paid profit by date
  const netWorthData = useMemo(() => {
    const paid = [...cycles]
      .filter((c) => c.status === 'Paid' && c.cardCashPaidDate)
      .sort((a, b) => (a.cardCashPaidDate < b.cardCashPaidDate ? -1 : 1))
    const baseline = Number(balance.liquidCash || 0) + Number(balance.personalSavings || 0)
    let running = baseline
    const points = [
      { label: 'Start', value: baseline },
      ...paid.map((c) => {
        running += netProfit(c)
        return { label: format(parseISO(c.cardCashPaidDate), 'MMM d'), value: Math.round(running) }
      }),
    ]
    return points
  }, [cycles, balance])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card-padded">
        <h3 className="section-title text-base">Profit per cycle</h3>
        <p className="section-sub mb-3">Net profit (paid uses actual, others use expected).</p>
        <div className="h-72">
          {profitData.length === 0 ? (
            <Empty text="Log a cycle to see profit history." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={text} fontSize={12} tick={{ fill: text }} />
                <YAxis stroke={text} fontSize={12} tick={{ fill: text }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0f172a' : '#fff',
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [fmtCurrency(v), 'Profit']}
                  labelFormatter={(l, p) => p?.[0]?.payload ? `${p[0].payload.model} · ${p[0].payload.date}` : l}
                />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {profitData.map((d, i) => (
                    <Cell key={i} fill={d.profit >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card-padded">
        <h3 className="section-title text-base">Cumulative net worth</h3>
        <p className="section-sub mb-3">Cash + savings + realized arbitrage profit.</p>
        <div className="h-72">
          {netWorthData.length <= 1 ? (
            <Empty text="Mark cycles as Paid to see the curve." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={text} fontSize={12} tick={{ fill: text }} />
                <YAxis stroke={text} fontSize={12} tick={{ fill: text }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0f172a' : '#fff',
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [fmtCurrency(v), 'Net worth']}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <div className="h-full flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">{text}</div>
}
