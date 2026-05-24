import { useState } from 'react'
import { Sun, Moon, Trash2, Download, Upload, Truck, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import Modal from './ui/Modal'
import Confirm from './ui/Confirm'
import { useAppData } from '../lib/AppData'
import { STORAGE_KEYS, loadFromStorage } from '../lib/storage'
import { pingProxy } from '../lib/tracking'

export default function SettingsPanel({ open, onClose }) {
  const { settings, setSettings, resetAll } = useAppData()
  const [confirmReset, setConfirmReset] = useState(false)
  const [proxyDraft, setProxyDraft] = useState(settings.trackingProxyUrl || '')
  const [pingState, setPingState] = useState({ state: 'idle', message: '' })

  // Keep draft in sync if settings change externally (e.g., import)
  if (proxyDraft !== (settings.trackingProxyUrl || '') && pingState.state === 'idle') {
    // No-op; user is editing. We only sync from external source on first open.
  }

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

  const saveProxy = () => {
    const cleaned = (proxyDraft || '').trim()
    setSettings({ ...settings, trackingProxyUrl: cleaned })
    setPingState({ state: cleaned ? 'saved' : 'cleared', message: cleaned ? 'Saved.' : 'Cleared.' })
  }

  const testProxy = async () => {
    const url = (proxyDraft || '').trim()
    if (!url) return setPingState({ state: 'error', message: 'Enter a URL first.' })
    setPingState({ state: 'testing', message: 'Pinging…' })
    try {
      const data = await pingProxy(url)
      setPingState({ state: 'ok', message: data?.message || 'Connected. Proxy is responding.' })
    } catch (err) {
      setPingState({ state: 'error', message: err.message || String(err) })
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Settings" size="lg">
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
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <Truck size={15} /> Tracking API
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Live UPS/USPS/FedEx status requires a small proxy you deploy yourself
              (browsers can't call UPS directly). See <code>/worker</code> in the repo
              for a Cloudflare Worker template you can deploy in under 5 minutes.
              Without this, the Track button still opens the public carrier page.
            </p>
            <label className="label">Proxy URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                placeholder="https://dylans-hq-tracking.your-name.workers.dev"
                className="input flex-1 font-mono text-xs"
                value={proxyDraft}
                onChange={(e) => { setProxyDraft(e.target.value); setPingState({ state: 'idle', message: '' }) }}
              />
              <button className="btn-secondary" onClick={testProxy} disabled={pingState.state === 'testing'}>
                <RefreshCw size={15} className={pingState.state === 'testing' ? 'animate-spin' : ''} /> Test
              </button>
              <button className="btn-primary" onClick={saveProxy}>Save</button>
            </div>
            {pingState.message && (
              <div className={`mt-2 text-xs flex items-start gap-1.5 ${
                pingState.state === 'error' ? 'text-rose-600 dark:text-rose-400'
                : pingState.state === 'ok' ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
              }`}>
                {pingState.state === 'ok' && <Check size={13} className="mt-0.5 shrink-0" />}
                {pingState.state === 'error' && <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
                <span className="break-words">{pingState.message}</span>
              </div>
            )}
            {settings.trackingProxyUrl && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Currently using: <code className="break-all">{settings.trackingProxyUrl}</code>
              </p>
            )}
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
