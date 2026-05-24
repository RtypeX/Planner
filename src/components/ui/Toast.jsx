import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const TONES = {
  success: { ring: 'ring-emerald-300 dark:ring-emerald-700', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  error:   { ring: 'ring-rose-300 dark:ring-rose-700',       icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
  info:    { ring: 'ring-brand-300 dark:ring-brand-700',     icon: Info,          color: 'text-brand-600 dark:text-brand-400' },
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => onClose?.(), toast.duration || 4500)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null
  const tone = TONES[toast.type] || TONES.info
  const Icon = tone.icon

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-[60] flex justify-center pointer-events-none px-4">
      <div className={`pointer-events-auto card flex items-start gap-3 px-4 py-3 max-w-md w-full ring-1 ${tone.ring}`}>
        <Icon size={18} className={`shrink-0 mt-0.5 ${tone.color}`} />
        <div className="flex-1 min-w-0">
          {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
          <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{toast.message}</div>
        </div>
        <button className="btn-ghost !p-1" onClick={onClose} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
