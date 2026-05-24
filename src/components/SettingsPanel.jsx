import { useState } from 'react'
import { Sun, Moon, Trash2, Download, Upload } from 'lucide-react'
import Modal from './ui/Modal'
import Confirm from './ui/Confirm'
import { useAppData } from '../lib/AppData'
import { STORAGE_KEYS, loadFromStorage } from '../lib/storage'

export default function SettingsPanel({ open, onClose }) {
  const { settings, setSettings, resetAll } = useAppData()
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
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
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        Object.entries(STORAGE_KEYS).forEach(([k, storageKey]) => {
          if (data[k] !== undefined && data[k] !== null) {
            window.localStorage.setItem(storageKey, JSON.stringify(data[k]))
          }
        })
        window.location.reload()
      } catch (err) {
        alert('Invalid backup file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Settings">
        <div className="space-y-6">
          <section>
            <h4 className="font-semibold text-sm mb-3">Appearance</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`btn justify-center py-3 ${
                  settings.theme === 'light'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun size={16} /> Light
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`btn justify-center py-3 ${
                  settings.theme === 'dark'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </section>

          <section>
            <h4 className="font-semibold text-sm mb-3">Backup</h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary justify-center" onClick={exportData}>
                <Download size={16} /> Export JSON
              </button>
              <label className="btn-secondary justify-center cursor-pointer">
                <Upload size={16} /> Import JSON
                <input type="file" accept="application/json" onChange={importData} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Saves a single JSON snapshot of all modules. Importing replaces existing data.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-sm mb-3 text-rose-600 dark:text-rose-400">Danger Zone</h4>
            <button className="btn-danger w-full justify-center" onClick={() => setConfirmReset(true)}>
              <Trash2 size={16} /> Reset all data
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Wipes every <code>dylan_*</code> key from localStorage and reloads defaults.
            </p>
          </section>
        </div>
      </Modal>

      <Confirm
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetAll(); onClose?.() }}
        title="Reset all data?"
        message="This will permanently delete all cycles, workouts, milestones, balances, and other tracked data. This action cannot be undone."
        confirmLabel="Yes, reset everything"
        danger
      />
    </>
  )
}
