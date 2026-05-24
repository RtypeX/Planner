import { useMemo, useState } from 'react'
import { fmtCurrency, projectCycles, operatingCapital } from '../../lib/calc'
import { useAppData } from '../../lib/AppData'
import { DEFAULT_CARDCASH_RATE, PC_GOAL, PHONE_MODELS } from '../../lib/defaults'
import { Calculator, Target } from 'lucide-react'

export default function Projector() {
  const { balance, cycles } = useAppData()
  const liveCash = Number(balance.liquidCash || 0)
  const op = operatingCapital(cycles)

  const [override, setOverride] = useState('')
  const [phonesPerCycle, setPhonesPerCycle] = useState(2)
  const [model, setModel] = useState('iPhone 16e')
  const [rate, setRate] = useState(DEFAULT_CARDCASH_RATE)

  const startingCash = override === '' ? liveCash : Number(override) || 0

  const rows = useMemo(
    () => projectCycles(startingCash, phonesPerCycle, model, rate, 5),
    [startingCash, phonesPerCycle, model, rate],
  )

  const cumProfit = useMemo(() => {
    let total = 0
    return rows.map((r) => {
      total += r.expectedProfit
      return { ...r, cumProfit: total }
    })
  }, [rows])

  // cycles to PC goal
  const m = PHONE_MODELS[model]
  const profitPer = m.tradeIn * rate - (m.cost + m.mobileX)
  const profitPerCycle = phonesPerCycle * profitPer
  const cyclesToPC = profitPerCycle > 0 ? Math.ceil(PC_GOAL / profitPerCycle) : '∞'

  return (
    <div className="card-padded">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2"><Calculator size={18} /> Cycle projector</h3>
          <p className="section-sub">Forecast the next 5 cycles based on current cash + reinvestment.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-2 rounded-lg">
          <Target size={16} />
          <span><strong className="tabular-nums">{cyclesToPC}</strong> cycle{cyclesToPC === 1 ? '' : 's'} to PC goal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="label">Starting cash</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="input pr-16"
              value={override === '' ? liveCash : override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder={String(liveCash)}
            />
            {override !== '' && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                onClick={() => setOverride('')}
              >
                Use live
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Liquid: {fmtCurrency(liveCash)} · Tied up: {fmtCurrency(op)}
          </p>
        </div>

        <div>
          <label className="label">Phone model</label>
          <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.keys(PHONE_MODELS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div>
          <label className="label">CardCash rate</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="input pr-12"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value || '0'))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
              {(rate * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div>
          <label className="label">Phones per cycle: <span className="tabular-nums font-semibold">{phonesPerCycle}</span></label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={phonesPerCycle}
            onChange={(e) => setPhonesPerCycle(parseInt(e.target.value, 10))}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>1</span><span>4</span><span>8</span>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Cycle</th>
              <th>Phones</th>
              <th>Capital deployed</th>
              <th>Expected profit</th>
              <th>Cumulative profit</th>
              <th>Ending cash</th>
            </tr>
          </thead>
          <tbody>
            {cumProfit.map((r) => (
              <tr key={r.cycle}>
                <td className="font-semibold">#{r.cycle}</td>
                <td className="tabular-nums">{r.phones}</td>
                <td className="tabular-nums">{fmtCurrency(r.capitalDeployed)}</td>
                <td className="tabular-nums text-emerald-600 dark:text-emerald-400">{fmtCurrency(r.expectedProfit)}</td>
                <td className="tabular-nums">{fmtCurrency(r.cumProfit)}</td>
                <td className="tabular-nums font-semibold">{fmtCurrency(r.endingCash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
