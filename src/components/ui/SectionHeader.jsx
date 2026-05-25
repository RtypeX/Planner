/**
 * Section header — fully typographic. No icon tiles, no gradients.
 * Eyebrow → serif title → small sub. Actions live to the right.
 */
export default function SectionHeader({ icon: Icon, eyebrow, title, sub, actions }) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-[var(--rule)]">
      <div className="min-w-0">
        {(eyebrow || Icon) && (
          <div className="page-eyebrow">
            {Icon && <Icon size={11} strokeWidth={1.7} />}
            {eyebrow && <span>{eyebrow}</span>}
          </div>
        )}
        <h3 className="section-title mt-2">{title}</h3>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
