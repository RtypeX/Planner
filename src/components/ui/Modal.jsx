import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ open, onClose, title, eyebrow, children, footer, size = 'md' }) {
  const dialogRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!open) return

    // Save the element that had focus before the modal opened so we can
    // restore it on close — important for keyboard / screen-reader users.
    previouslyFocusedRef.current = document.activeElement

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        // Focus trap: cycle Tab focus inside the dialog.
        const focusables = dialogRef.current.querySelectorAll(FOCUSABLE)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    // Focus the first focusable element after the dialog mounts.
    requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelector(FOCUSABLE)
      focusable?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // Restore focus to whatever opened the modal.
      const el = previouslyFocusedRef.current
      if (el && typeof el.focus === 'function') {
        try { el.focus() } catch { /* element may be gone */ }
      }
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
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
