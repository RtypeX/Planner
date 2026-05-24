import { useState } from 'react'
import { TrendingUp, Dumbbell, Map, Wallet, Settings as SettingsIcon, Menu, X } from 'lucide-react'
import SettingsPanel from './SettingsPanel'

const NAV = [
  { id: 'arbitrage', label: 'Arbitrage', icon: TrendingUp },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'timeline', label: 'Timeline', icon: Map },
  { id: 'finance', label: 'Finance', icon: Wallet },
]

export default function Layout({ activeTab, setActiveTab, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Brand />
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button className="btn-ghost w-full justify-start" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon size={18} /> Settings
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <Brand compact />
          <button className="btn-ghost !p-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile slide-over menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <Brand compact />
              <button className="btn-ghost !p-2" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1">
              {NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                />
              ))}
            </nav>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <button className="btn-ghost w-full justify-start" onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false) }}>
                <SettingsIcon size={18} /> Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 h-16">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function Brand({ compact = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? '' : 'px-5 py-5 border-b border-slate-200 dark:border-slate-800'}`}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white font-extrabold shadow-md">
        D
      </div>
      <div>
        <div className="font-bold leading-tight">Dylan's HQ</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Personal command center</div>
      </div>
    </div>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      {item.label}
    </button>
  )
}
