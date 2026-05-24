export default function StatCard({ label, value, sub, icon: Icon, accent = 'brand', children }) {
  const accents = {
    brand: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30',
    violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30',
    slate: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
  }
  return (
    <div className="card-padded">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="stat-label">{label}</div>
          <div className="stat-value mt-1 truncate">{value}</div>
          {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-xl p-2 ${accents[accent] || accents.brand}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
