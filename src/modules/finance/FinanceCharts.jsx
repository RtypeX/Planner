import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts'
import { TrendingUp, BarChart3 } from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import EmptyState from '../../components/ui/EmptyState'
import { useAppData } from '../../lib/AppData'
import { fmtCurrency, netProfit } from '../../lib/calc'
import { format, parseISO } from 'date-fns'

export default function FinanceCharts() {
  const { cycles, balance, settings } = useAppData()
  const isDark = settings.theme === 'dark'
  const grid = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'
  const text = isDark ? '#94a3b8' : '#64748b'

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

  const tooltipStyle = {
    background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${grid}`,
    borderRadius: 12,
    fontSize: 12,
    boxShadow: '0 8px 24px -8px rgba(0,0,0,0.2)',
    padding: 10,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card-padded">
        <SectionHeader
          icon={BarChart3}
          accent="emerald"
          title="Profit per cycle"
          sub="Green = profit, red = loss."
        />
        <div className="h-72">
          {profitData.length === 0 ? (
            <EmptyState icon={BarChart3} title="No data yet" description="Log a cycle to see profit history." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} margin={{ top: 5, right: 10, bottom: 0, left: -5 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} />
                <YAxis stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }}
                  formatter={(v) => [fmtCurrency(v), 'Profit']}
                  labelFormatter={(l, p) => p?.[0]?.payload ? `${p[0].payload.model} · ${p[0].payload.date}` : l}
                />
                <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                  {profitData.map((d, i) => (
                    <Cell key={i} fill={d.profit >= 0 ? 'url(#emeraldBar)' : 'url(#roseBar)'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="emeraldBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="roseBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card-padded">
        <SectionHeader
          icon={TrendingUp}
          accent="brand"
          title="Cumulative net worth"
          sub="Cash + savings + realized arbitrage profit."
        />
        <div className="h-72">
          {netWorthData.length <= 1 ? (
            <EmptyState icon={TrendingUp} title="No data yet" description="Mark cycles as Paid to see the curve." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthData} margin={{ top: 5, right: 10, bottom: 0, left: -5 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} />
                <YAxis stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: grid, strokeWidth: 1, strokeDasharray: '4 4' }}
                  formatter={(v) => [fmtCurrency(v), 'Net worth']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#netGrad)"
                      dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }}
                      activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
