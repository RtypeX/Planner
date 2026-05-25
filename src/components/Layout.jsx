import { useState } from 'react'
import {
  Settings as SettingsIcon, Menu, X, Bot,
} from 'lucide-react'
import SettingsPanel from './SettingsPanel'

const NAV = [
  { id: 'home',      label: 'Home',      number: '01' },
  { id: 'arbitrage', label: 'Arbitrage', number: '02' },
  { id: 'fitness',   label: 'Fitness',   number: '03' },
  { id: 'timeline',  label: 'Timeline',  number: '04' },
  { id: 'finance',   label: 'Finance',   number: '05' },
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
      {/* ───────── Desktop sidebar ───────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0
                        border-r border-[var(--rule)]
                        bg-[var(--paper-0)]">
        <Brand />
        <nav className="flex-1 px-4 py-4 space-y-px">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-[var(--rule)] space-y-px">
          {onOpenAssistant && (
            <SidebarLink icon={Bot} label="Assistant" onClick={onOpenAssistant} />
          )}
          <SidebarLink icon={SettingsIcon} label="Settings" onClick={() => setSettingsOpen(true)} />
          <KbdHint />
        </div>
      </aside>

      {/* ───────── Mobile top bar ───────── */}
      <header className="lg:hidden sticky top-0 z-30
                         bg-[var(--paper-0)]
                         border-b border-[var(--rule)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                {activeItem.number} · {activeItem.label}
              </div>
              <div className="font-display text-base text-[var(--ink-1)] -mt-0.5 truncate"
                   style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>
                Dylan's HQ
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ───────── Mobile slide-over ───────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-[var(--ink-1)]/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--paper-0)]
                          border-l border-[var(--rule)]
                          flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[var(--rule)]">
              <Brand inline />
              <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-px">
              {NAV.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                />
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-[var(--rule)] space-y-px">
              {onOpenAssistant && (
                <SidebarLink icon={Bot} label="Assistant" onClick={() => { onOpenAssistant(); setMobileMenuOpen(false) }} />
              )}
              <SidebarLink icon={SettingsIcon} label="Settings" onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false) }} />
            </div>
          </div>
        </div>
      )}

      {/* ───────── Main content ───────── */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-0">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-10">
          {children}
        </div>
      </main>

      {/* ───────── Mobile bottom tab bar ───────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30
                      bg-[var(--paper-0)]
                      border-t border-[var(--rule)]
                      pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          {NAV.map((item) => {
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center transition-colors"
                aria-label={item.label}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-[var(--accent)]" />
                )}
                <span className={`font-mono text-[10px] uppercase tracking-[0.10em] ${
                  active ? 'text-[var(--ink-1)]' : 'text-[var(--ink-3)]'
                }`}>
                  {item.number}
                </span>
                <span className={`text-[11px] mt-0.5 font-medium ${
                  active ? 'text-[var(--ink-1)]' : 'text-[var(--ink-3)]'
                }`}>
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

function SidebarLink({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm
                 text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink-1)]
                 transition-colors"
    >
      <Icon size={14} strokeWidth={1.7} />
      <span>{label}</span>
    </button>
  )
}

function KbdHint() {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')
  return (
    <div className="px-3 py-2 mt-2 flex items-center justify-between
                    text-[10px] font-mono text-[var(--ink-3)] tracking-[0.10em] uppercase">
      <span>Quick</span>
      <kbd className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </div>
  )
}

function Brand({ inline = false }) {
  return (
    <div className={`flex items-center gap-3 ${inline ? '' : 'px-5 py-6 border-b border-[var(--rule)]'}`}>
      <BrandMark />
      <div className="min-w-0">
        <div className="font-display text-[var(--ink-1)] leading-none"
             style={{ fontWeight: 500, fontSize: '17px', letterSpacing: '-0.02em' }}>
          Dylan's HQ
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-3)] mt-1">
          Field journal
        </div>
      </div>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
      <span className="font-display text-[var(--ink-1)] leading-none"
            style={{ fontWeight: 600, fontSize: '20px', letterSpacing: '-0.04em' }}>
        D
      </span>
      <span className="absolute -bottom-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
    </div>
  )
}

function NavButton({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all
        ${active
          ? 'nav-active'
          : 'text-[var(--ink-2)] hover:text-[var(--ink-1)] hover:bg-[var(--paper-2)]'
        }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className={`font-mono text-[10px] tracking-[0.10em] ${
        active ? 'text-[var(--accent)]' : 'text-[var(--ink-4)]'
      }`}>
        {item.number}
      </span>
      <span className={active ? 'font-medium' : ''}>{item.label}</span>
    </button>
  )
}
