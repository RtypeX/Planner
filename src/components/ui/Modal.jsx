import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ open, onClose, title, eyebrow, children, footer, size = 'md' }) {
  const dialogRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!open) return
    previouslyFocusedRef.current = document.activeElement

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(FOCUSABLE)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelector(FOCUSABLE)
      focusable?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      const el = previouslyFocusedRef.current
      if (el && typeof el.focus === 'function') {
        try { el.focus() } catch { /* element may be gone */ }
      }
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-[var(--ink-1)]/40" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        className={`relative w-full ${widths[size] || widths.md} max-h-[92vh] overflow-y-auto
                    bg-[var(--paper-1)]
                    border border-[var(--rule-strong)]
                    shadow-soft-lg
                    animate-slide-up`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5
                        border-b border-[var(--rule)]
                        sticky top-0 bg-[var(--paper-1)] z-10">
          <div className="min-w-0">
            {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
            <h3 className="font-display text-lg sm:text-xl text-[var(--ink-1)] truncate mt-1.5"
                style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>
              {title}
            </h3>
          </div>
          <button className="btn btn-ghost btn-icon -mr-2 -mt-1" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--rule)]
                          flex justify-end gap-2 sticky bottom-0
                          bg-[var(--paper-1)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
