import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const TONES = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  error: {
    icon: AlertTriangle,
    bar: 'bg-rose-500',
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  info: {
    icon: Info,
    bar: 'bg-brand-500',
    iconColor: 'text-brand-600 dark:text-brand-400',
    iconBg: 'bg-brand-50 dark:bg-brand-500/10',
  },
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
    <div className="fixed inset-x-0 bottom-20 lg:bottom-auto lg:top-6 lg:right-6 lg:left-auto z-[60] flex justify-center lg:justify-end pointer-events-none px-4">
      <div
        className="pointer-events-auto card flex items-stretch gap-0 max-w-md w-full sm:w-auto sm:min-w-[320px]
                   shadow-soft-lg overflow-hidden animate-slide-up"
      >
        <div className={`w-1 ${tone.bar}`} />
        <div className="flex-1 flex items-start gap-3 p-3.5 pr-2">
          <div className={`icon-tile ${tone.iconBg} ${tone.iconColor}`}>
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            {toast.title && (
              <div className="font-semibold text-sm text-slate-900 dark:text-white">{toast.title}</div>
            )}
            {toast.message && (
              <div className="text-[13px] text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-wrap break-words">
                {toast.message}
              </div>
            )}
          </div>
          <button className="btn-ghost !p-1 self-start" onClick={onClose} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
