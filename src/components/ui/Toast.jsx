import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const TONES = {
  success: { Icon: CheckCircle2,   tint: '#30d158' },
  error:   { Icon: AlertTriangle,  tint: '#ff453a' },
  info:    { Icon: Info,           tint: '#0a84ff' },
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const duration = toast.duration || (toast.action ? 8000 : 4500)
    const t = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null
  const { Icon, tint } = TONES[toast.type] || TONES.info

  const handleAction = () => {
    try { toast.action?.onClick?.() } finally { onClose?.() }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-24 lg:bottom-auto lg:top-6 lg:right-6 lg:left-auto z-[60]
                 flex justify-center lg:justify-end pointer-events-none px-4"
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="pointer-events-auto glass-strong
                      max-w-md w-full sm:w-auto sm:min-w-[320px]
                      animate-spring-up overflow-hidden">
        <div className="flex items-start gap-3 p-3.5 pr-2.5">
          <div className="icon-tile shrink-0" style={{ color: tint, boxShadow: `0 0 0 1px ${tint}30 inset, 0 1px 0 var(--glass-shine) inset` }}>
            <Icon size={16} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            {toast.title && (
              <div className="text-[14px] font-semibold text-[var(--label-1)] tracking-tight">
                {toast.title}
              </div>
            )}
            {toast.message && (
              <div className="text-[13px] text-[var(--label-2)] mt-0.5 whitespace-pre-wrap break-words leading-snug">
                {toast.message}
              </div>
            )}
            {toast.action && (
              <button
                className="mt-2 text-[13px] font-semibold hover:underline"
                style={{ color: tint }}
                onClick={handleAction}
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button className="btn btn-ghost btn-icon shrink-0 !w-7 !h-7 !p-1" onClick={onClose} aria-label="Dismiss">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
