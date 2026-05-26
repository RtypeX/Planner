import { useEffect, useMemo, useState } from 'react'
import { Calculator, Target, Zap } from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import { fmtCurrency, projectCycles, operatingCapital } from '../../lib/calc'
import { useAppData } from '../../lib/AppData'
import { DEFAULT_CARDCASH_RATE, PC_GOAL, findModel } from '../../lib/defaults'

export default function Projector() {
  const { balance, cycles, phoneModels } = useAppData()
  const liveCash = Number(balance.liquidCash || 0)
  const op = operatingCapital(cycles)

  const [override, setOverride] = useState('')
  const [phonesPerCycle, setPhonesPerCycle] = useState(2)
  const [model, setModel] = useState(phoneModels[0]?.name || 'iPhone 16e')
  const [rate, setRate] = useState(DEFAULT_CARDCASH_RATE)

  // Keep selected model valid if user deletes/renames in Settings.
  useEffect(() => {
    if (!phoneModels.some((m) => m.name === model)) {
      setModel(phoneModels[0]?.name || '')
    }
  }, [phoneModels, model])

  const startingCash = override === '' ? liveCash : Number(override) || 0

  const rows = useMemo(
    () => projectCycles(startingCash, phonesPerCycle, model, rate, 5, phoneModels),
    [startingCash, phonesPerCycle, model, rate, phoneModels],
  )

  const cumProfit = useMemo(() => {
    let total = 0
    return rows.map((r) => {
      total += r.expectedProfit
      return { ...r, cumProfit: total }
    })
  }, [rows])

  const m = findModel(phoneModels, model)
  const profitPer = (m?.tradeIn ?? 0) * rate - ((m?.cost ?? 0) + (m?.mobileX ?? 0))
  const profitPerCycle = phonesPerCycle * profitPer
  const cyclesToPC = profitPerCycle > 0 ? Math.ceil(PC_GOAL / profitPerCycle) : '∞'

  return (
    <section>
      <SectionHeader
        icon={Calculator}
        accent="brand"
        eyebrow="Forecast"
        title="Cycle projector"
        sub="Forecast the next 5 cycles based on current cash and reinvestment."
        actions={
          <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2
                          bg-emerald-500/12 text-emerald-300
                          ring-1 ring-emerald-500/30">
            <Target size={15} />
            <span>
              <strong className="tabular-nums">{cyclesToPC}</strong> cycle{cyclesToPC === 1 ? '' : 's'} to PC goal
            </span>
          </div>
        }
      />

      <div className="card-padded">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  onClick={() => setOverride('')}
                >
                  Live
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Liquid {fmtCurrency(liveCash)} · Tied {fmtCurrency(op)}
            </p>
          </div>

          <div>
            <label className="label">Phone model</label>
            <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
              {phoneModels.map((pm) => <option key={pm.id} value={pm.name}>{pm.name}</option>)}
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {(rate * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Phones/cycle</span>
              <span className="tabular-nums font-bold text-brand-600 dark:text-brand-400 text-sm normal-case tracking-normal">
                {phonesPerCycle}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={phonesPerCycle}
              onChange={(e) => setPhonesPerCycle(parseInt(e.target.value, 10))}
              className="w-full accent-brand-600 mt-1"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              <span>1</span><span>4</span><span>8</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Phones</th>
                  <th>Capital</th>
                  <th>Profit</th>
                  <th>Cumulative</th>
                  <th>Ending cash</th>
                </tr>
              </thead>
              <tbody>
                {cumProfit.map((r) => (
                  <tr key={r.cycle}>
                    <td>
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs"
                        style={{ background: 'rgba(10,132,255,0.14)', color: '#0a84ff' }}
                      >
                        {r.cycle}
                      </span>
                    </td>
                    <td className="tabular-nums font-semibold">{r.phones}</td>
                    <td className="tabular-nums">{fmtCurrency(r.capitalDeployed)}</td>
                    <td className="tabular-nums font-semibold flex items-center gap-1" style={{ color: '#30d158' }}>
                      <Zap size={11} /> {fmtCurrency(r.expectedProfit)}
                    </td>
                    <td className="tabular-nums">{fmtCurrency(r.cumProfit)}</td>
                    <td className="tabular-nums font-bold">{fmtCurrency(r.endingCash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
