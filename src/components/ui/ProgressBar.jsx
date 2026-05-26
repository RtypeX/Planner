/**
 * ProgressBar — iOS-style fill with subtle inner highlight.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'blue',
  label,
  showPct = true,
  size = 'md',
  onDark = false,
  shimmer = false,
}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100))
  const tints = {
    blue:    'linear-gradient(90deg, #0a84ff, #2e8aff)',
    indigo:  'linear-gradient(90deg, #5e5ce6, #7d7bff)',
    purple:  'linear-gradient(90deg, #bf5af2, #d97cff)',
    green:   'linear-gradient(90deg, #30d158, #5ed987)',
    orange:  'linear-gradient(90deg, #ff9f0a, #ffb942)',
    red:     'linear-gradient(90deg, #ff453a, #ff6b62)',
    pink:    'linear-gradient(90deg, #ff375f, #ff5a82)',
    cyan:    'linear-gradient(90deg, #64d2ff, #8edfff)',
    white:   'linear-gradient(90deg, rgba(255,255,255,0.95), #ffffff)',
    // back-compat
    brand:   'linear-gradient(90deg, #0a84ff, #2e8aff)',
    accent:  'linear-gradient(90deg, #0a84ff, #2e8aff)',
    sea:     'linear-gradient(90deg, #30d158, #5ed987)',
    sage:    'linear-gradient(90deg, #30d158, #5ed987)',
    sunset:  'linear-gradient(90deg, #ff9f0a, #ffb942)',
    amber:   'linear-gradient(90deg, #ff9f0a, #ffb942)',
    rose:    'linear-gradient(90deg, #ff453a, #ff6b62)',
    violet:  'linear-gradient(90deg, #bf5af2, #d97cff)',
    iris:    'linear-gradient(90deg, #5e5ce6, #7d7bff)',
    emerald: 'linear-gradient(90deg, #30d158, #5ed987)',
    clay:    'linear-gradient(90deg, #ff453a, #ff6b62)',
    steel:   'linear-gradient(90deg, #5e5ce6, #7d7bff)',
    ink:     'linear-gradient(90deg, #8e8e93, #aeaeb2)',
  }
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2', xl: 'h-2.5' }
  return (
    <div>
      {(label || showPct) && (
        <div className={`flex items-center justify-between mb-2 ${
          onDark ? 'text-white/85' : 'text-[var(--label-3)]'
        }`}>
          <span className="text-[12px] font-medium">{label}</span>
          {showPct && (
            <span className="text-[12px] font-semibold tabular-nums">
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`progress ${heights[size] || heights.md} ${onDark ? '!bg-white/15' : ''}`}>
        <div
          className="progress-bar relative overflow-hidden"
          style={{ width: `${pct}%`, background: tints[color] || tints.blue }}
        >
          {shimmer && pct > 0 && pct < 100 && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  )
}
