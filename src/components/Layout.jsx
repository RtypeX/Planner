import { useState } from 'react'
import { TrendingUp, Dumbbell, Map, Wallet, Settings as SettingsIcon, Menu, X } from 'lucide-react'
import SettingsPanel from './SettingsPanel'

const NAV = [
  { id: 'arbitrage', label: 'Arbitrage', icon: TrendingUp },
  { id: 'fitness',   label: 'Fitness',   icon: Dumbbell },
  { id: 'timeline',  label: 'Timeline',  icon: Map },
  { id: 'finance',   label: 'Finance',   icon: Wallet },
]

export default function Layout({ activeTab, setActiveTab, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeItem = NAV.find((n) => n.id === activeTab) || NAV[0]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ───────── Desktop sidebar ───────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-slate-200/70 dark:border-white/[0.05]
                        bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl">
        <Brand />
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200/70 dark:border-white/[0.05]">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-slate-600 dark:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon size={17} /> Settings
          </button>
        </div>
      </aside>

      {/* ───────── Mobile top bar ───────── */}
      <header className="lg:hidden sticky top-0 z-30
                         bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl
                         border-b border-slate-200/70 dark:border-white/[0.05]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Dylan's HQ
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white -mt-0.5 truncate">
                {activeItem.label}
              </div>
            </div>
          </div>
          <button className="btn-ghost !p-2" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ───────── Mobile slide-over ───────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900
                          border-l border-slate-200 dark:border-white/[0.06]
                          flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.06]">
              <Brand inline />
              <button className="btn-ghost !p-2" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-0.5">
              {NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                />
              ))}
            </nav>
            <div className="p-3 border-t border-slate-200 dark:border-white/[0.06]">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                           text-slate-600 dark:text-slate-300
                           hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false) }}
              >
                <SettingsIcon size={17} /> Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Main content ───────── */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
          {children}
        </div>
      </main>

      {/* ───────── Mobile bottom tab bar ───────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30
                      bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl
                      border-t border-slate-200/70 dark:border-white/[0.05]
                      pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-brand-500" />
                )}
                <Icon
                  size={20}
                  className={active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function Brand({ inline = false }) {
  return (
    <div className={`flex items-center gap-3 ${inline ? '' : 'px-5 py-5 border-b border-slate-200/70 dark:border-white/[0.05]'}`}>
      <BrandMark />
      <div className="min-w-0">
        <div className="font-bold leading-tight tracking-tight">Dylan's HQ</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Personal command center</div>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 via-brand-600 to-indigo-700
                    flex items-center justify-center text-white font-extrabold shadow-glow-brand
                    ring-1 ring-white/20">
      <span className="text-base">D</span>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-slate-950" />
    </div>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${active
          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft shadow-brand-500/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
        }`}
    >
      <Icon size={17} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </button>
  )
}
