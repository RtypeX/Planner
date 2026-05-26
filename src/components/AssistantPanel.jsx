import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import HQAssistantChat from './HQAssistantChat'

/**
 * AssistantPanel — slide-over wrapper around the HQAssistantChat.
 *
 * Uses the AnimatedAIChat aesthetic (deep black + ambient orbs +
 * gradient typography) but wires up our actual Gemini + tool-calling
 * backend underneath.
 */
export default function AssistantPanel({ open, onClose }) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Assistant">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
          />

          {/* Sheet — full height on mobile, anchored right on desktop */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[560px] bg-[#06060a] border-l border-white/[0.06] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            {/* Close button — floating top-right */}
            <button
              className="absolute top-4 right-4 z-20 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* The actual chat */}
            <div className="flex-1 overflow-hidden">
              <HQAssistantChat onClose={onClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
