import { Suspense, lazy, useEffect, useState } from 'react'
import { AppDataProvider, useAppData } from './lib/AppData'
import Layout from './components/Layout'
import Toast from './components/ui/Toast'
import CommandPalette from './components/CommandPalette'
import StorageBanner from './components/StorageBanner'
import KeyboardHelp from './components/KeyboardHelp'
import ErrorBoundary from './components/ErrorBoundary'
import { runMigrations } from './lib/migrations'

// Code-split the heavy modules. Recharts ships with the chart-bearing
// modules, so deferring those nets the biggest first-paint win.
const HomeModule = lazy(() => import('./modules/home/HomeModule'))
const ArbitrageModule = lazy(() => import('./modules/arbitrage/ArbitrageModule'))
const FitnessModule = lazy(() => import('./modules/fitness/FitnessModule'))
const TimelineModule = lazy(() => import('./modules/timeline/TimelineModule'))
const FinanceModule = lazy(() => import('./modules/finance/FinanceModule'))
const AssistantPanel = lazy(() => import('./components/AssistantPanel'))

// Run schema migrations once before any provider mounts.
runMigrations()

const TAB_KEYS = ['home', 'arbitrage', 'fitness', 'timeline', 'finance']

export default function App() {
  return (
    <ErrorBoundary>
      <AppDataProvider>
        <Shell />
      </AppDataProvider>
    </ErrorBoundary>
  )
}

function Shell() {
  const [activeTab, setActiveTab] = useState('home')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { toast, showToast } = useAppData()

  // Global keyboard shortcuts
  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
    }

    const onKey = (e) => {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '')
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // ⌘K / Ctrl+K — toggle palette
      if (cmdOrCtrl && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((p) => !p)
        return
      }

      // ⌘/ Ctrl+/ — toggle assistant
      if (cmdOrCtrl && !e.shiftKey && !e.altKey && e.key === '/') {
        e.preventDefault()
        setAssistantOpen((a) => !a)
        return
      }

      // Single-key shortcuts only when no input has focus and no modifiers held.
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isInputFocused()) return

      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(true)
      } else if (e.key === 'n' || e.key === 'N') {
        // "n" = quick-create. Goes to the right module then dispatches the
        // event the module already listens for.
        e.preventDefault()
        if (activeTab === 'arbitrage' || activeTab === 'home') {
          window.dispatchEvent(new CustomEvent('hq:new-cycle'))
          if (activeTab !== 'arbitrage') setActiveTab('arbitrage')
        } else if (activeTab === 'fitness') {
          window.dispatchEvent(new CustomEvent('hq:log-workout'))
        } else if (activeTab === 'timeline') {
          window.dispatchEvent(new CustomEvent('hq:new-milestone'))
        }
      } else if (/^[1-5]$/.test(e.key)) {
        // 1–5 jump to tabs.
        e.preventDefault()
        setActiveTab(TAB_KEYS[Number(e.key) - 1])
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault()
        setAssistantOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [activeTab])

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        onOpenAssistant={() => setAssistantOpen(true)}
      >
        <StorageBanner />
        <Suspense fallback={<ModuleFallback />}>
          {/* `key` makes React unmount + mount on tab change, replaying the
              module's stagger entrance animation. Feels like real navigation. */}
          <div key={activeTab} className="animate-fade-in">
            {activeTab === 'home'      && <HomeModule goTo={setActiveTab} onOpenAssistant={() => setAssistantOpen(true)} />}
            {activeTab === 'arbitrage' && <ArbitrageModule />}
            {activeTab === 'fitness'   && <FitnessModule />}
            {activeTab === 'timeline'  && <TimelineModule />}
            {activeTab === 'finance'   && <FinanceModule />}
          </div>
        </Suspense>
      </Layout>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        goTo={(tab) => setActiveTab(tab)}
        openSettings={() => setSettingsOpen(true)}
        openAssistant={() => setAssistantOpen(true)}
      />

      <Suspense fallback={null}>
        <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      </Suspense>

      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Toast toast={toast} onClose={() => showToast(null)} />
    </>
  )
}

function ModuleFallback() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-12 w-1/3 rounded-lg bg-slate-200/60 dark:bg-white/[0.05] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200/60 dark:bg-white/[0.05] animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-white/[0.05] animate-pulse" />
    </div>
  )
}
