import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

/**
 * StatCard — editorial style.
 *
 *  - default: bordered tile, hairline label above, big serif number, optional sub.
 *  - compact: smaller variant for grid metrics.
 *  - hero:    no border, just typographic hierarchy. Used at the top of pages.
 */
export default function StatCard({
  label, value, sub, icon: Icon,
  accent = 'ink',
  variant = 'default',
  trend,
  children,
}) {
  if (variant === 'hero') return <HeroStat label={label} value={value} sub={sub} icon={Icon}>{children}</HeroStat>
  if (variant === 'compact') return <CompactStat label={label} value={value} sub={sub} icon={Icon} accent={accent} trend={trend}>{children}</CompactStat>

  return (
    <div className="numeric-tile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-3 truncate">{value}</div>
          {sub && <div className="text-xs text-[var(--ink-3)] mt-2">{sub}</div>}
          {trend !== undefined && trend !== null && <TrendBadge value={trend} />}
        </div>
        {Icon && <Icon size={16} strokeWidth={1.5} className="text-[var(--ink-3)] shrink-0 mt-0.5" />}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

function HeroStat({ label, value, sub, icon: Icon, children }) {
  return (
    <div className="lede">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="stat-label">{label}</div>
          <div className="font-display mt-3 text-[var(--ink-1)] leading-none"
               style={{ fontWeight: 500, fontSize: 'clamp(48px, 40px + 3vw, 84px)', letterSpacing: '-0.04em' }}>
            {value}
          </div>
          {sub && <div className="text-sm text-[var(--ink-3)] mt-3 max-w-md">{sub}</div>}
        </div>
        {Icon && <Icon size={20} strokeWidth={1.5} className="text-[var(--ink-3)] shrink-0 mt-1" />}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

function CompactStat({ label, value, sub, icon: Icon, accent = 'ink', children, trend }) {
  // Accents change a small dot color; everything else stays neutral.
  const dotColor = {
    ink:    'bg-[var(--ink-3)]',
    accent: 'bg-[var(--accent)]',
    sage:   'bg-sage-500',
    clay:   'bg-clay-500',
    steel:  'bg-steel-500',
  }[accent] || 'bg-[var(--ink-3)]'

  return (
    <div className="numeric-tile group">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-1 h-1 rounded-full ${dotColor}`} />
          <div className="stat-label">{label}</div>
        </div>
        {Icon && <Icon size={13} strokeWidth={1.5} className="text-[var(--ink-3)]" />}
      </div>
      <div className="font-display text-[var(--ink-1)] leading-none truncate"
           style={{ fontWeight: 500, fontSize: '28px', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--ink-3)] mt-2 truncate">{sub}</div>}
      {trend !== undefined && trend !== null && <TrendBadge value={trend} />}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function TrendBadge({ value }) {
  const positive = Number(value) >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-mono tabular-nums ${
      positive ? 'text-sage-500' : 'text-clay-500'
    }`}>
      <Icon size={11} strokeWidth={2} />
      {positive ? '+' : ''}{value}
    </span>
  )
}
