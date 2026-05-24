export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'brand',
  label,
  showPct = true,
  size = 'md',
  onDark = false,
}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100))
  const colors = {
    brand:   'from-brand-400 to-brand-600',
    emerald: 'from-emerald-400 to-emerald-600',
    amber:   'from-amber-400 to-amber-500',
    rose:    'from-rose-400 to-rose-600',
    violet:  'from-violet-400 to-violet-600',
    white:   'from-white/90 to-white',
  }
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' }
  return (
    <div>
      {(label || showPct) && (
        <div className={`flex items-center justify-between text-xs mb-1.5 ${onDark ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'}`}>
          <span className="font-medium">{label}</span>
          {showPct && <span className="tabular-nums font-semibold">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`progress ${heights[size] || heights.md} ${onDark ? '!bg-white/15' : ''}`}>
        <div
          className={`progress-bar bg-gradient-to-r ${colors[color] || colors.brand}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
