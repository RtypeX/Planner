import { Component } from 'react'
import { AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { STORAGE_KEYS, loadFromStorage } from '../lib/storage'

/**
 * Catches render-time errors in any descendant. Renders a recovery UI that
 * lets the user reload, or export their data first so a buggy build can't
 * trap them in a broken state with no escape hatch.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info)
  }

  exportData = () => {
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
    } catch (e) {
      alert('Could not export: ' + e.message)
    }
  }

  reload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-padded max-w-md w-full">
          <div className="icon-tile bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 mb-4">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Something went wrong</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            The app hit a render error. Your data is still saved in this browser.
            Export a backup before reloading just to be safe.
          </p>
          <pre className="mt-3 text-[11px] font-mono bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg p-2 max-h-40 overflow-auto text-rose-700 dark:text-rose-300">
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn-secondary justify-center" onClick={this.exportData}>
              <Download size={14} /> Export
            </button>
            <button className="btn-primary justify-center" onClick={this.reload}>
              <RefreshCw size={14} /> Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
