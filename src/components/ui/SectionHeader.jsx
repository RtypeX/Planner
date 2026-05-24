export default function SectionHeader({ icon: Icon, eyebrow, title, sub, actions, accent = 'brand' }) {
  const accents = {
    brand:   'text-brand-600   dark:text-brand-300   bg-brand-50   dark:bg-brand-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    amber:   'text-amber-600   dark:text-amber-300   bg-amber-50   dark:bg-amber-500/10',
    violet:  'text-violet-600  dark:text-violet-300  bg-violet-50  dark:bg-violet-500/10',
    slate:   'text-slate-600   dark:text-slate-300   bg-slate-100  dark:bg-white/[0.06]',
  }
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className={`icon-tile shrink-0 ${accents[accent] || accents.brand}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
          <h3 className="section-title">{title}</h3>
          {sub && <p className="section-sub mt-0.5">{sub}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
