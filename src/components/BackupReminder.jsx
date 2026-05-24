import { useEffect, useState } from 'react'
import { Download, X, ShieldAlert } from 'lucide-react'
import { useAppData } from '../lib/AppData'
import { STORAGE_KEYS, loadFromStorage } from '../lib/storage'

const REMIND_AFTER_DAYS = 14

/**
 * Soft reminder shown on Home when the user hasn't exported a backup recently.
 * Dismissible and idempotent — clicking Export updates the lastBackupAt
 * timestamp so the banner naturally goes away.
 */
export default function BackupReminder() {
  const { meta, markBackedUp, showToast } = useAppData()
  const [dismissed, setDismissed] = useState(false)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    // Only nudge if there's actually data worth backing up.
    const cycles = loadFromStorage(STORAGE_KEYS.cycles, [])
    const workouts = loadFromStorage(STORAGE_KEYS.workouts, [])
    setHasData((cycles?.length || 0) + (workouts?.length || 0) > 0)
  }, [])

  if (dismissed || !hasData) return null
  const last = meta.lastBackupAt ? new Date(meta.lastBackupAt) : null
  const daysSince = last ? Math.floor((Date.now() - last.getTime()) / 86400000) : Infinity
  if (daysSince < REMIND_AFTER_DAYS) return null

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
      a.download = `dylans-hq-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      markBackedUp()
      showToast({ type: 'success', title: 'Exported', message: 'Backup saved to Downloads.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Export failed', message: err.message })
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 flex items-start gap-3">
      <ShieldAlert size={16} className="text-amber-600 dark:text-amber-300 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-amber-900 dark:text-amber-200">
          Time for a backup
        </div>
        <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
          {last
            ? `Last backup was ${daysSince} day${daysSince === 1 ? '' : 's'} ago.`
            : "You haven't exported your data yet."}
          {' '}One bad cache clear and it's gone — takes 2 seconds.
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button className="btn-secondary text-xs !py-1.5" onClick={exportData}>
          <Download size={13} /> Export now
        </button>
        <button className="btn-ghost !p-1.5" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
