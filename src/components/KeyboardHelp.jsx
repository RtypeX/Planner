import Modal from './ui/Modal'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], altKeys: ['Ctrl', 'K'], desc: 'Open command palette' },
  { keys: ['⌘', '/'], altKeys: ['Ctrl', '/'], desc: 'Toggle AI assistant' },
  { keys: ['G'], desc: 'Open AI assistant' },
  { keys: ['N'], desc: 'New cycle / workout / milestone (context-aware)' },
  { keys: ['1'], desc: 'Home' },
  { keys: ['2'], desc: 'Arbitrage' },
  { keys: ['3'], desc: 'Fitness' },
  { keys: ['4'], desc: 'Timeline' },
  { keys: ['5'], desc: 'Finance' },
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Esc'], desc: 'Close modals / palette' },
]

export default function KeyboardHelp({ open, onClose }) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="md">
      <ul className="space-y-2">
        {SHORTCUTS.map((s, i) => {
          const keys = isMac ? s.keys : (s.altKeys || s.keys)
          return (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-200">{s.desc}</span>
              <span className="flex items-center gap-1">
                {keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.06]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4">
        Single-letter shortcuts are ignored while typing in an input.
      </p>
    </Modal>
  )
}
