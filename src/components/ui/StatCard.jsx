import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * StatCard
 *  - variant: 'default' | 'hero' | 'compact'
 *  - accent: brand | emerald | amber | rose | violet | slate
 */
export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'brand',
  variant = 'default',
  trend,
  children,
}) {
  if (variant === 'hero') return <HeroStat label={label} value={value} sub={sub} icon={Icon} trend={trend}>{children}</HeroStat>
  if (variant === 'compact') return <CompactStat label={label} value={value} sub={sub} icon={Icon} accent={accent} trend={trend}>{children}</CompactStat>

  const accents = {
    brand:   'text-brand-600   dark:text-brand-300   bg-brand-50   dark:bg-brand-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    amber:   'text-amber-600   dark:text-amber-300   bg-amber-50   dark:bg-amber-500/10',
    rose:    'text-rose-600    dark:text-rose-300    bg-rose-50    dark:bg-rose-500/10',
    violet:  'text-violet-600  dark:text-violet-300  bg-violet-50  dark:bg-violet-500/10',
    slate:   'text-slate-600   dark:text-slate-300   bg-slate-100  dark:bg-white/[0.06]',
  }
  return (
    <div className="card-padded card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-1.5 truncate">{value}</div>
          {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
          {trend !== undefined && trend !== null && <TrendBadge value={trend} />}
        </div>
        {Icon && (
          <div className={`icon-tile shrink-0 ${accents[accent] || accents.brand}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

function HeroStat({ label, value, sub, icon: Icon, trend, children }) {
  return (
    <div className="card-hero p-5 sm:p-6">
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-white/70">{label}</div>
          <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight mt-1.5 truncate">
            {value}
          </div>
          {sub && <div className="text-sm text-white/80 mt-1">{sub}</div>}
          {trend !== undefined && trend !== null && <TrendBadge value={trend} onDark />}
        </div>
        {Icon && (
          <div className="icon-tile shrink-0 bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </div>
  )
}

function CompactStat({ label, value, sub, icon: Icon, accent = 'brand', children }) {
  const accents = {
    brand:   'text-brand-600   dark:text-brand-300',
    emerald: 'text-emerald-600 dark:text-emerald-300',
    amber:   'text-amber-600   dark:text-amber-300',
    rose:    'text-rose-600    dark:text-rose-300',
    violet:  'text-violet-600  dark:text-violet-300',
    slate:   'text-slate-600   dark:text-slate-300',
  }
  return (
    <div className="card p-3 sm:p-4 card-hover">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className={accents[accent] || accents.brand} />}
        <div className="stat-label">{label}</div>
      </div>
      <div className="text-xl font-bold tabular-nums tracking-tight mt-1.5 truncate">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</div>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

function TrendBadge({ value, onDark = false }) {
  const positive = Number(value) >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  const color = onDark
    ? (positive ? 'text-emerald-200 bg-emerald-400/15 ring-emerald-300/20' : 'text-rose-200 bg-rose-400/15 ring-rose-300/20')
    : (positive ? 'text-emerald-700 bg-emerald-50 ring-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/20'
                : 'text-rose-700    bg-rose-50    ring-rose-200    dark:text-rose-300    dark:bg-rose-500/10    dark:ring-rose-500/20')
  return (
    <span className={`mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${color}`}>
      <Icon size={11} /> {positive ? '+' : ''}{value}
    </span>
  )
}
