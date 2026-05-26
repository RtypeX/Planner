import { useState } from 'react'
import {
  Home, TrendingUp, Dumbbell, Map as MapIcon, Wallet,
  Settings as SettingsIcon, Menu, X, Bot,
} from 'lucide-react'
import SettingsPanel from './SettingsPanel'

const NAV = [
  { id: 'home',      label: 'Home',      icon: Home,        tint: '#0a84ff' },
  { id: 'arbitrage', label: 'Arbitrage', icon: TrendingUp,  tint: '#bf5af2' },
  { id: 'fitness',   label: 'Fitness',   icon: Dumbbell,    tint: '#30d158' },
  { id: 'timeline',  label: 'Timeline',  icon: MapIcon,     tint: '#ff9f0a' },
  { id: 'finance',   label: 'Finance',   icon: Wallet,      tint: '#5e5ce6' },
]

export default function Layout({
  activeTab, setActiveTab, children,
  settingsOpen: ctlSettingsOpen,
  setSettingsOpen: ctlSetSettingsOpen,
  onOpenAssistant,
}) {
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false)
  const settingsOpen = ctlSettingsOpen ?? internalSettingsOpen
  const setSettingsOpen = ctlSetSettingsOpen ?? setInternalSettingsOpen
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeItem = NAV.find((n) => n.id === activeTab) || NAV[0]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ───────── Desktop sidebar — floating glass ───────── */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-0 h-screen p-4">
        <div className="glass-strong h-full flex flex-col p-2">
          <Brand />
          <nav className="flex-1 px-2 py-2 space-y-1">
            {NAV.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>
          <div className="px-2 py-2 border-t border-[var(--separator-thin)] space-y-1">
            {onOpenAssistant && (
              <SidebarLink icon={Bot} label="Assistant" onClick={onOpenAssistant} />
            )}
            <SidebarLink icon={SettingsIcon} label="Settings" onClick={() => setSettingsOpen(true)} />
            <KbdHint />
          </div>
        </div>
      </aside>

      {/* ───────── Mobile top bar — frosted ───────── */}
      <header className="lg:hidden sticky top-0 z-30 px-3 pt-3">
        <div className="glass flex items-center justify-between px-3 h-14 rounded-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[var(--label-3)]">
                Dylan's HQ
              </div>
              <div className="text-[15px] font-semibold text-[var(--label-1)] -mt-0.5 truncate tracking-tight">
                {activeItem.label}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ───────── Mobile slide-over ───────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-3 top-3 bottom-3 w-72 glass-strong p-2 flex flex-col animate-spring-up">
            <div className="flex items-center justify-between p-3">
              <Brand inline />
              <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-2 space-y-1">
              {NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                />
              ))}
            </nav>
            <div className="px-2 py-2 border-t border-[var(--separator-thin)] space-y-1">
              {onOpenAssistant && (
                <SidebarLink icon={Bot} label="Assistant" onClick={() => { onOpenAssistant(); setMobileMenuOpen(false) }} />
              )}
              <SidebarLink icon={SettingsIcon} label="Settings" onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false) }} />
            </div>
          </div>
        </div>
      )}

      {/* ───────── Main content ───────── */}
      <main className="flex-1 min-w-0 pb-28 lg:pb-0 lg:pr-4 lg:pt-4">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* ───────── Mobile bottom tab bar — floating glass ───────── */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="glass-strong rounded-3xl px-2 py-1.5">
          <div className="grid grid-cols-5">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex flex-col items-center justify-center py-2 transition-transform active:scale-90"
                  style={{ transition: 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)' }}
                  aria-label={item.label}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.4 : 1.7}
                    style={{ color: active ? item.tint : 'var(--label-3)' }}
                  />
                  <span className={`text-[10px] mt-0.5 font-semibold tracking-tight transition-colors ${
                    active ? 'text-[var(--label-1)]' : 'text-[var(--label-3)]'
                  }`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function SidebarLink({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                 text-[var(--label-2)] hover:bg-[var(--glass-bg-thin)] hover:text-[var(--label-1)]
                 transition-colors"
    >
      <Icon size={16} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  )
}

function KbdHint() {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')
  return (
    <div className="px-3 py-2 mt-2 flex items-center justify-between text-[11px] text-[var(--label-3)]">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-sys-green animate-soft-pulse" />
        Quick actions
      </span>
      <kbd className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </div>
  )
}

function Brand({ inline = false }) {
  return (
    <div className={`flex items-center gap-3 ${inline ? '' : 'px-3 py-3'}`}>
      <BrandMark />
      <div className="min-w-0">
        <div className="font-bold text-[16px] text-[var(--label-1)] leading-none tracking-tight">
          Dylan's HQ
        </div>
        <div className="text-[11px] text-[var(--label-3)] mt-1">Personal command center</div>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="relative w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0
                    bg-gradient-to-br from-sys-blue via-sys-indigo to-sys-purple
                    shadow-glow-blue ring-1 ring-white/20">
      <span className="text-white font-bold text-[15px] tracking-tight">D</span>
    </div>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all
        ${active
          ? 'nav-active'
          : 'text-[var(--label-2)] hover:bg-[var(--glass-bg-thin)] hover:text-[var(--label-1)]'
        }`}
      style={{ transition: 'all 240ms cubic-bezier(0.32, 0.72, 0, 1)' }}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        size={17}
        strokeWidth={active ? 2.2 : 1.7}
        style={{ color: active ? item.tint : 'currentColor' }}
        className="shrink-0"
      />
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  )
}
