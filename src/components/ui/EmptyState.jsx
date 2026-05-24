export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-4 animate-fade-in">
      {Icon && (
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[0.06] dark:to-white/[0.02] flex items-center justify-center mb-4 ring-1 ring-slate-200/80 dark:ring-white/[0.04]">
          <Icon size={22} className="text-slate-500 dark:text-slate-400" />
        </div>
      )}
      {title && <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>}
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
