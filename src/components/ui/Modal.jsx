import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, eyebrow, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${widths[size] || widths.md} max-h-[92vh] overflow-y-auto
                    rounded-t-2xl sm:rounded-2xl
                    bg-white dark:bg-slate-900
                    border border-slate-200/80 dark:border-white/[0.06]
                    shadow-2xl shadow-slate-950/20 dark:shadow-black/40
                    animate-slide-up`}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4
                        border-b border-slate-200/70 dark:border-white/[0.06]
                        sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="min-w-0">
            {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
            <h3 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white truncate">{title}</h3>
          </div>
          <button className="btn-ghost !p-1.5 -mr-1.5" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-200/70 dark:border-white/[0.06]
                          flex justify-end gap-2 sticky bottom-0
                          bg-white/95 dark:bg-slate-900/95 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
