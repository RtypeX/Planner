import { useEffect } from 'react'
import { X } from 'lucide-react'

const ACCENTS = {
  success: 'bg-sage-500',
  error:   'bg-clay-500',
  info:    'bg-[var(--accent)]',
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const duration = toast.duration || (toast.action ? 8000 : 4500)
    const t = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null
  const accent = ACCENTS[toast.type] || ACCENTS.info

  const handleAction = () => {
    try { toast.action?.onClick?.() } finally { onClose?.() }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-20 lg:bottom-auto lg:top-6 lg:right-6 lg:left-auto z-[60]
                 flex justify-center lg:justify-end pointer-events-none px-4"
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="pointer-events-auto card flex items-stretch gap-0
                      max-w-md w-full sm:w-auto sm:min-w-[300px]
                      shadow-soft-lg overflow-hidden animate-slide-up">
        <div className={`w-0.5 ${accent}`} />
        <div className="flex-1 flex items-start gap-3 px-4 py-3 pr-2">
          <div className="flex-1 min-w-0">
            {toast.title && (
              <div className="font-display text-[15px] text-[var(--ink-1)]"
                   style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
                {toast.title}
              </div>
            )}
            {toast.message && (
              <div className="text-[13px] text-[var(--ink-2)] mt-0.5 whitespace-pre-wrap break-words">
                {toast.message}
              </div>
            )}
            {toast.action && (
              <button
                className="mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
                onClick={handleAction}
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button className="btn btn-ghost btn-icon !p-1 self-start" onClick={onClose} aria-label="Dismiss">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
