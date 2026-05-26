import { accentTint } from './StatCard'

/**
 * SectionHeader — colored glass icon + title stack.
 * Title sits inline with optional eyebrow above; actions float right.
 */
export default function SectionHeader({ icon: Icon, eyebrow, title, sub, actions, accent = 'blue' }) {
  const tint = accentTint(accent)
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div
            className="icon-tile shrink-0 mt-0.5"
            style={{ color: tint, boxShadow: `0 0 0 1px ${tint}30 inset, 0 1px 0 var(--glass-shine) inset` }}
          >
            <Icon size={16} strokeWidth={1.8} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="page-eyebrow" style={{ color: tint }}>{eyebrow}</div>}
          <h3 className="section-title">{title}</h3>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
