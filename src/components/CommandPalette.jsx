import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, Home, TrendingUp, Dumbbell, Map as MapIcon, Wallet, Settings as SettingsIcon,
  Plus, RefreshCw, Sun, Moon, Trash2, ArrowDownUp, CornerDownLeft, X, Bot, Calendar,
} from 'lucide-react'
import { useAppData } from '../lib/AppData'

/**
 * Modern command palette: ⌘K / Ctrl+K to toggle.
 * Items are split into NAV, ACTION, and CYCLES (recent) sections. Filter is a
 * simple case-insensitive substring match against label and subtitle.
 */
export default function CommandPalette({ open, onClose, goTo, openSettings, openAssistant }) {
  const {
    cycles, refreshAllTracking, settings, setSettings,
  } = useAppData()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)

  // Reset on each open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // focus input next tick
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Build the static + dynamic items
  const allItems = useMemo(() => {
    const items = [
      // Navigation
      { id: 'nav-home',      group: 'Pages',   label: 'Home',      icon: Home,       keywords: 'dashboard',       action: () => goTo('home') },
      { id: 'nav-arbitrage', group: 'Pages',   label: 'Arbitrage', icon: TrendingUp, keywords: 'cycles iphone',   action: () => goTo('arbitrage') },
      { id: 'nav-fitness',   group: 'Pages',   label: 'Fitness',   icon: Dumbbell,   keywords: 'workout bmt run', action: () => goTo('fitness') },
      { id: 'nav-timeline',  group: 'Pages',   label: 'Timeline',  icon: MapIcon,    keywords: 'milestone asvab', action: () => goTo('timeline') },
      { id: 'nav-finance',   group: 'Pages',   label: 'Finance',   icon: Wallet,     keywords: 'goals net worth', action: () => goTo('finance') },
      { id: 'nav-settings',  group: 'Pages',   label: 'Settings',  icon: SettingsIcon, keywords: 'preferences theme tracking', action: () => openSettings() },
      ...(openAssistant ? [{
        id: 'nav-assistant', group: 'Pages',
        label: 'AI assistant', subtitle: 'Chat to log entries from Sheets data',
        icon: Bot, keywords: 'chat ai gemini sheets import',
        action: () => openAssistant(),
      }] : []),

      // Quick actions
      {
        id: 'act-new-cycle', group: 'Actions',
        label: 'New cycle', subtitle: 'Add an iPhone arbitrage cycle',
        icon: Plus, keywords: 'add order',
        action: () => { goTo('arbitrage'); window.dispatchEvent(new CustomEvent('hq:new-cycle')) },
      },
      {
        id: 'act-log-workout', group: 'Actions',
        label: 'Log workout', subtitle: 'Quick-add a fitness session',
        icon: Plus, keywords: 'fitness run',
        action: () => { goTo('fitness'); window.dispatchEvent(new CustomEvent('hq:log-workout')) },
      },
      {
        id: 'act-new-milestone', group: 'Actions',
        label: 'New milestone', subtitle: 'Add a date to the timeline',
        icon: Plus, keywords: 'goal date',
        action: () => { goTo('timeline'); window.dispatchEvent(new CustomEvent('hq:new-milestone')) },
      },
      {
        id: 'act-refresh-tracking', group: 'Actions',
        label: 'Refresh all tracking', subtitle: 'Pull latest UPS status',
        icon: RefreshCw, keywords: 'shipment ups',
        action: () => refreshAllTracking(),
      },
      {
        id: 'act-export-ical', group: 'Actions',
        label: 'Export milestones to calendar', subtitle: 'Download .ics file',
        icon: Calendar, keywords: 'ical calendar timeline export',
        action: () => window.dispatchEvent(new CustomEvent('hq:export-ical')),
      },
      {
        id: 'act-toggle-theme', group: 'Actions',
        label: settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        subtitle: 'Toggle appearance',
        icon: settings.theme === 'dark' ? Sun : Moon,
        keywords: 'dark light mode',
        action: () => setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' }),
      },
    ]

    // Recent cycles (top 5 by orderDate desc)
    const recent = [...cycles]
      .filter((c) => c.orderDate)
      .sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1))
      .slice(0, 5)
      .map((c) => ({
        id: `cycle-${c.id}`,
        group: 'Recent cycles',
        label: `${c.model} × ${c.quantity}`,
        subtitle: `${c.status} · ${c.orderDate}${c.trackingNumber ? ` · ${c.trackingNumber}` : ''}`,
        icon: TrendingUp,
        keywords: `${c.model} ${c.trackingNumber || ''} ${c.status}`,
        action: () => { goTo('arbitrage') },
      }))

    return [...items, ...recent]
  }, [cycles, settings, goTo, openSettings, refreshAllTracking, setSettings, openAssistant])

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter((it) => {
      const hay = `${it.label} ${it.subtitle || ''} ${it.keywords || ''} ${it.group}`.toLowerCase()
      return hay.includes(q)
    })
  }, [allItems, query])

  // Keep activeIdx in bounds when filter changes
  useEffect(() => { setActiveIdx(0) }, [query])

  // Group for rendering
  const grouped = useMemo(() => {
    const groups = []
    const map = new Map()
    filtered.forEach((it, i) => {
      if (!map.has(it.group)) {
        map.set(it.group, [])
        groups.push({ name: it.group, items: map.get(it.group) })
      }
      map.get(it.group).push({ ...it, _idx: i })
    })
    return groups
  }, [filtered])

  // Keyboard nav
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = filtered[activeIdx]
        if (item) { item.action(); onClose() }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, filtered, activeIdx, onClose])

  // Lock background scroll when open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:pt-[14vh] animate-fade-in">
      <div className="absolute inset-0 bg-[var(--ink-1)]/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl
                      bg-[var(--paper-1)]
                      border border-[var(--rule-strong)]
                      shadow-soft-lg
                      overflow-hidden animate-slide-up">
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--rule)]">
          <Search size={15} strokeWidth={1.6} className="text-[var(--ink-3)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, run actions, jump to a cycle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-[14px] text-[var(--ink-1)]
                       placeholder:text-[var(--ink-4)]"
          />
          {query && (
            <button className="btn btn-ghost btn-icon !p-1" onClick={() => setQuery('')} aria-label="Clear">
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
          <kbd className="kbd hidden sm:inline-flex">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="font-display text-[var(--ink-1)] text-lg" style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>
                Nothing matches.
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--ink-3)] mt-2">
                "{query}"
              </div>
            </div>
          ) : (
            <ul className="py-2">
              {grouped.map((g) => (
                <li key={g.name}>
                  <div className="px-4 pt-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    {g.name}
                  </div>
                  <ul>
                    {g.items.map((item) => {
                      const Icon = item.icon || Search
                      const active = item._idx === activeIdx
                      return (
                        <li key={item.id}>
                          <button
                            onMouseEnter={() => setActiveIdx(item._idx)}
                            onClick={() => { item.action(); onClose() }}
                            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
                              ${active
                                ? 'bg-[var(--paper-2)] text-[var(--ink-1)]'
                                : 'text-[var(--ink-2)] hover:bg-[var(--paper-2)]'}`}
                          >
                            <Icon size={14} strokeWidth={1.6} className={`shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--ink-3)]'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm">{item.label}</div>
                              {item.subtitle && (
                                <div className="text-[11px] text-[var(--ink-3)] mt-0.5 truncate">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                            {active && (
                              <CornerDownLeft size={12} strokeWidth={1.5} className="text-[var(--accent)] shrink-0" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-[var(--rule)]
                        flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--ink-3)]">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> nav
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="kbd">↵</kbd> select
            </span>
          </div>
          <span className="font-mono text-[10px] tabular-nums uppercase tracking-[0.10em] text-[var(--ink-3)]">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  )
}
