import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
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
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size] || widths.md} max-h-[92vh] overflow-y-auto card rounded-t-2xl sm:rounded-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
