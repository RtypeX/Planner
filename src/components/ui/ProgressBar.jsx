export default function ProgressBar({ value = 0, max = 100, color = 'brand', label, showPct = true }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100))
  const colors = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
  }
  return (
    <div>
      {(label || showPct) && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          {showPct && <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className="progress">
        <div className={`progress-bar ${colors[color] || colors.brand}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
