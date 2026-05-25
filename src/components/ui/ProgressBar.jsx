/**
 * Progress bar — single hairline. No gradients, no glow.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'accent',
  label,
  showPct = true,
  size = 'md',
  onDark = false,
}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100))
  const colors = {
    accent: 'bg-[var(--accent)]',
    ink:    'bg-[var(--ink-1)]',
    sage:   'bg-sage-500',
    clay:   'bg-clay-500',
    steel:  'bg-steel-500',
    white:  'bg-white',
  }
  const heights = { sm: 'h-px', md: 'h-0.5', lg: 'h-1', xl: 'h-1.5' }
  return (
    <div>
      {(label || showPct) && (
        <div className={`flex items-center justify-between mb-2 ${
          onDark ? 'text-white/85' : 'text-[var(--ink-3)]'
        }`}>
          <span className="font-mono text-[10px] uppercase tracking-[0.10em]">{label}</span>
          {showPct && (
            <span className="font-mono text-[10px] tabular-nums uppercase tracking-[0.10em]">
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`progress ${heights[size] || heights.md} ${onDark ? '!bg-white/15' : ''}`}>
        <div
          className={`progress-bar ${colors[color] || colors.accent}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
