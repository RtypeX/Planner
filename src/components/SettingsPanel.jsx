import { useState } from 'react'
import {
  Sun, Moon, Trash2, Download, Upload, Truck, Check, AlertTriangle, RefreshCw,
  Smartphone, Plus, RotateCcw,
} from 'lucide-react'
import Modal from './ui/Modal'
import Confirm from './ui/Confirm'
import { useAppData } from '../lib/AppData'
import { STORAGE_KEYS, loadFromStorage, uid } from '../lib/storage'
import { defaultPhoneModels } from '../lib/defaults'
import { pingProxy } from '../lib/tracking'

export default function SettingsPanel({ open, onClose }) {
  const { settings, setSettings, resetAll, phoneModels, setPhoneModels } = useAppData()
  const [confirmReset, setConfirmReset] = useState(false)
  const [proxyDraft, setProxyDraft] = useState(settings.trackingProxyUrl || '')
  const [pingState, setPingState] = useState({ state: 'idle', message: '' })

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

  // ── Phone model CRUD ──────────────────────────────────────
  const updateModel = (id, patch) =>
    setPhoneModels(phoneModels.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const removeModel = (id) =>
    setPhoneModels(phoneModels.filter((m) => m.id !== id))
  const addModel = () => {
    setPhoneModels([
      ...phoneModels,
      { id: uid(), name: 'New model', cost: 0, mobileX: 8, tradeIn: 0 },
    ])
  }
  const restoreDefaultModels = () => setPhoneModels(defaultPhoneModels())

  return (
    <>
      <Modal open={open} onClose={onClose} eyebrow="Settings" title="Configuration" size="lg">
        <div className="space-y-7">
          {/* Theme */}
          <section>
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200 mb-3">
              Appearance
            </h4>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`btn justify-center py-2.5 transition ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-slate-900 shadow-soft text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun size={15} /> Light
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`btn justify-center py-2.5 transition ${
                  settings.theme === 'dark'
                    ? 'bg-white dark:bg-slate-900 shadow-soft text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon size={15} /> Dark
              </button>
            </div>
          </section>

          {/* Phone models */}
          <section>
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Smartphone size={13} /> Phone models
              </h4>
              <div className="flex items-center gap-1">
                <button className="btn-ghost text-[11px] !py-1.5" onClick={restoreDefaultModels} title="Restore the iPhone 16e and iPhone 13 defaults">
                  <RotateCcw size={12} /> Restore defaults
                </button>
                <button className="btn-secondary text-xs !py-1.5" onClick={addModel}>
                  <Plus size={13} /> Add model
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              These show up in the cycle form and projector dropdown. Cost is what you
              pay for the phone, MobileX is the per-unit fee, and trade-in is the
              gift-card value MobileX gives you per phone.
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                <div className="col-span-5 sm:col-span-4">Name</div>
                <div className="col-span-2 sm:col-span-2 text-right">Cost</div>
                <div className="col-span-2 sm:col-span-2 text-right">MobileX</div>
                <div className="col-span-2 sm:col-span-3 text-right">Trade-in</div>
                <div className="col-span-1" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {phoneModels.map((m) => (
                  <div key={m.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <input
                      className="input col-span-5 sm:col-span-4 text-sm"
                      value={m.name}
                      onChange={(e) => updateModel(m.id, { name: e.target.value })}
                      placeholder="Model name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input col-span-2 sm:col-span-2 text-sm text-right tabular-nums"
                      value={m.cost}
                      onChange={(e) => updateModel(m.id, { cost: parseFloat(e.target.value || '0') })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input col-span-2 sm:col-span-2 text-sm text-right tabular-nums"
                      value={m.mobileX}
                      onChange={(e) => updateModel(m.id, { mobileX: parseFloat(e.target.value || '0') })}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="input col-span-2 sm:col-span-3 text-sm text-right tabular-nums"
                      value={m.tradeIn}
                      onChange={(e) => updateModel(m.id, { tradeIn: parseFloat(e.target.value || '0') })}
                    />
                    <button
                      className="col-span-1 btn-ghost !p-1.5 hover:!text-rose-600 justify-self-end"
                      onClick={() => removeModel(m.id)}
                      aria-label="Delete model"
                      disabled={phoneModels.length <= 1}
                      title={phoneModels.length <= 1 ? 'Need at least one model' : 'Delete model'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Existing cycles keep their snapshotted cost/trade-in values, so renaming
              or deleting a model won't break anything historic.
            </p>
          </section>

          {/* Tracking */}
          <section>
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Truck size={13} /> Tracking API
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Live UPS/USPS/FedEx status requires a small proxy you deploy yourself —
              browsers can't call UPS directly. See <code className="text-brand-600 dark:text-brand-400">/worker</code> for a
              Cloudflare Worker template you can deploy in under 5 minutes. Without
              it, the Track button still opens the public carrier page.
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
                Active: <code className="break-all">{settings.trackingProxyUrl}</code>
              </p>
            )}
          </section>

          {/* Backup */}
          <section>
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200 mb-3">
              Backup
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary justify-center" onClick={exportData}>
                <Download size={15} /> Export JSON
              </button>
              <label className="btn-secondary justify-center cursor-pointer">
                <Upload size={15} /> Import JSON
                <input type="file" accept="application/json" onChange={importData} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Saves a single JSON snapshot of all modules. Importing replaces existing data.
            </p>
          </section>

          {/* Danger zone */}
          <section>
            <h4 className="text-[11px] uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400 mb-3">
              Danger zone
            </h4>
            <button className="btn-danger w-full justify-center" onClick={() => setConfirmReset(true)}>
              <Trash2 size={15} /> Reset all data
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
