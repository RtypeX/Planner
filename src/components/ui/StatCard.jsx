import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

/**
 * StatCard — Liquid Glass.
 *  - default: padded glass tile, label + giant number
 *  - compact: smaller glass tile for grid rows
 *  - hero:    no card — pure typographic stack
 */
export default function StatCard({
  label, value, sub, icon: Icon,
  accent = 'blue',
  variant = 'default',
  trend,
  children,
}) {
  if (variant === 'hero')    return <HeroStat   label={label} value={value} sub={sub} icon={Icon} accent={accent}>{children}</HeroStat>
  if (variant === 'compact') return <CompactStat label={label} value={value} sub={sub} icon={Icon} accent={accent} trend={trend}>{children}</CompactStat>

  return (
    <div className="card-padded card-hover group">
      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0 flex-1">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-2 truncate">{value}</div>
          {sub && <div className="text-[13px] text-[var(--label-3)] mt-1.5">{sub}</div>}
          {trend !== undefined && trend !== null && <TrendBadge value={trend} />}
        </div>
        {Icon && <AccentIcon Icon={Icon} accent={accent} />}
      </div>
      {children && <div className="mt-3 relative">{children}</div>}
    </div>
  )
}

function HeroStat({ label, value, sub, icon: Icon, accent = 'blue', children }) {
  const tint = accentTint(accent)
  return (
    <div className="relative">
      <div className="stat-label">{label}</div>
      <div className="font-bold text-[var(--label-1)] mt-3 leading-[0.95] tracking-tightest"
           style={{ fontSize: 'clamp(48px, 40px + 3vw, 76px)' }}>
        {value}
      </div>
      {sub && <div className="text-[15px] text-[var(--label-3)] mt-3 max-w-md">{sub}</div>}
      {children && <div className="mt-5">{children}</div>}
      {Icon && (
        <div className="absolute top-0 right-0 icon-tile" style={{ color: tint }}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
      )}
    </div>
  )
}

function CompactStat({ label, value, sub, icon: Icon, accent = 'blue', children, trend }) {
  return (
    <div className="card-padded card-hover group">
      <div className="flex items-center justify-between gap-2 mb-2 relative">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentTint(accent) }} />
          <div className="stat-label">{label}</div>
        </div>
        {Icon && <Icon size={14} strokeWidth={1.7} className="text-[var(--label-3)]" />}
      </div>
      <div className="font-bold text-[var(--label-1)] leading-none tracking-tightest truncate"
           style={{ fontSize: '28px', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div className="text-[12px] text-[var(--label-3)] mt-2 truncate">{sub}</div>}
      {trend !== undefined && trend !== null && <TrendBadge value={trend} />}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function AccentIcon({ Icon, accent = 'blue' }) {
  const tint = accentTint(accent)
  return (
    <div
      className="icon-tile shrink-0 group-hover:scale-105 transition-transform duration-300"
      style={{ color: tint, boxShadow: `0 0 0 1px ${tint}30 inset, 0 1px 0 var(--glass-shine) inset` }}
    >
      <Icon size={16} strokeWidth={1.8} />
    </div>
  )
}

function TrendBadge({ value }) {
  const positive = Number(value) >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums"
          style={{ color: positive ? '#30d158' : '#ff453a' }}>
      <Icon size={12} strokeWidth={2.2} />
      {positive ? '+' : ''}{value}
    </span>
  )
}

export function accentTint(accent) {
  const map = {
    blue:    '#0a84ff',
    indigo:  '#5e5ce6',
    purple:  '#bf5af2',
    pink:    '#ff375f',
    red:     '#ff453a',
    orange:  '#ff9f0a',
    yellow:  '#ffd60a',
    green:   '#30d158',
    mint:    '#63e6e2',
    teal:    '#40c8e0',
    cyan:    '#64d2ff',
    // back-compat aliases for old props in existing modules
    brand:   '#0a84ff',
    sea:     '#30d158',
    sage:    '#30d158',
    sunset:  '#ff9f0a',
    iris:    '#bf5af2',
    violet:  '#bf5af2',
    rose:    '#ff453a',
    amber:   '#ff9f0a',
    emerald: '#30d158',
    slate:   '#8e8e93',
    ink:     '#8e8e93',
    accent:  '#0a84ff',
    clay:    '#ff453a',
    steel:   '#5e5ce6',
  }
  return map[accent] || map.blue
}
