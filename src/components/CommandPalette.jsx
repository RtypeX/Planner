import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, Home, TrendingUp, Dumbbell, Map, Wallet, Settings as SettingsIcon,
  Plus, RefreshCw, Sun, Moon, Trash2, ArrowDownUp, CornerDownLeft, X,
} from 'lucide-react'
import { useAppData } from '../lib/AppData'

/**
 * Modern command palette: ⌘K / Ctrl+K to toggle.
 * Items are split into NAV, ACTION, and CYCLES (recent) sections. Filter is a
 * simple case-insensitive substring match against label and subtitle.
 */
export default function CommandPalette({ open, onClose, goTo, openSettings }) {
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
      { id: 'nav-timeline',  group: 'Pages',   label: 'Timeline',  icon: Map,        keywords: 'milestone asvab', action: () => goTo('timeline') },
      { id: 'nav-finance',   group: 'Pages',   label: 'Finance',   icon: Wallet,     keywords: 'goals net worth', action: () => goTo('finance') },
      { id: 'nav-settings',  group: 'Pages',   label: 'Settings',  icon: SettingsIcon, keywords: 'preferences theme tracking', action: () => openSettings() },

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
  }, [cycles, settings, goTo, openSettings, refreshAllTracking, setSettings])

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
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 sm:pt-[12vh] animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900
                      border border-slate-200/80 dark:border-white/[0.06]
                      shadow-2xl shadow-slate-950/30 dark:shadow-black/50
                      overflow-hidden animate-slide-up">
        {/* Search header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/70 dark:border-white/[0.06]">
          <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, run actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white
                       placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {query && (
            <button className="btn-ghost !p-1" onClick={() => setQuery('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded
                          bg-slate-100 dark:bg-white/[0.08] text-[10px] font-mono
                          text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matches for <span className="font-semibold text-slate-700 dark:text-slate-200">"{query}"</span>
            </div>
          ) : (
            <ul className="py-1">
              {grouped.map((g) => (
                <li key={g.name}>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
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
                                ? 'bg-brand-50 dark:bg-brand-500/15 text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
                          >
                            <div className={`icon-tile shrink-0 transition-colors
                              ${active
                                ? 'bg-brand-500 text-white'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'}`}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{item.label}</div>
                              {item.subtitle && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                            {active && (
                              <CornerDownLeft size={13} className="text-slate-400 shrink-0" />
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
        <div className="px-4 py-2 border-t border-slate-200/70 dark:border-white/[0.06]
                        flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ArrowDownUp size={11} /> navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft size={11} /> select
            </span>
          </div>
          <span>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  )
}
