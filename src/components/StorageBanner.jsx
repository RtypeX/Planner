import { AlertTriangle, Download, X } from 'lucide-react'
import { useAppData } from '../lib/AppData'
import { STORAGE_KEYS, loadFromStorage } from '../lib/storage'

/**
 * Persistent banner shown when localStorage writes fail. The most likely
 * cause is the per-origin quota (~5–10MB) but Safari private mode + restrictive
 * security policies can also throw. Either way, the data the user is editing
 * isn't being persisted, and they need to know — silently swallowing the error
 * would be the worst possible default.
 */
export default function StorageBanner() {
  const { storageError, clearStorageError, markBackedUp } = useAppData()
  if (!storageError) return null

  const exportData = () => {
    try {
      const dump = {}
      Object.entries(STORAGE_KEYS).forEach(([k, v]) => {
        dump[k] = loadFromStorage(v, null)
      })
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dylans-hq-emergency-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      markBackedUp()
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="mb-4 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 flex items-start gap-3"
      role="alert"
    >
      <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-rose-900 dark:text-rose-200">
          Saving failed — your latest changes may not be on disk
        </div>
        <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 break-words">
          {storageError.message}
          {storageError.key ? ` (${storageError.key})` : ''}
        </div>
        <div className="text-xs text-rose-700 dark:text-rose-300 mt-1">
          Export a backup before reloading.
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button className="btn-secondary text-xs !py-1.5" onClick={exportData}>
          <Download size={13} /> Export
        </button>
        <button className="btn-ghost !p-1.5" onClick={clearStorageError} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
