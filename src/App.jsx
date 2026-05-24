import { useEffect, useState } from 'react'
import { AppDataProvider, useAppData } from './lib/AppData'
import Layout from './components/Layout'
import Toast from './components/ui/Toast'
import CommandPalette from './components/CommandPalette'
import HomeModule from './modules/home/HomeModule'
import ArbitrageModule from './modules/arbitrage/ArbitrageModule'
import FitnessModule from './modules/fitness/FitnessModule'
import TimelineModule from './modules/timeline/TimelineModule'
import FinanceModule from './modules/finance/FinanceModule'

export default function App() {
  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  )
}

function Shell() {
  const [activeTab, setActiveTab] = useState('home')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { toast, showToast } = useAppData()

  // Global ⌘K / Ctrl+K to toggle the palette.
  useEffect(() => {
    const onKey = (e) => {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '')
      const cmd = (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && !e.altKey
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((p) => !p)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      >
        {/* `key` makes React unmount + mount on tab change, replaying the
            module's stagger entrance animation. Feels like real navigation. */}
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'home'      && <HomeModule goTo={setActiveTab} />}
          {activeTab === 'arbitrage' && <ArbitrageModule />}
          {activeTab === 'fitness'   && <FitnessModule />}
          {activeTab === 'timeline'  && <TimelineModule />}
          {activeTab === 'finance'   && <FinanceModule />}
        </div>
      </Layout>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        goTo={(tab) => setActiveTab(tab)}
        openSettings={() => setSettingsOpen(true)}
      />

      <Toast toast={toast} onClose={() => showToast(null)} />
    </>
  )
}
