import { useEffect, useRef, useState } from 'react'

/**
 * Smoothly animate a number toward `value` whenever it changes.
 * Uses requestAnimationFrame + easeOutCubic. Respects prefers-reduced-motion.
 *
 *   const animated = useCountUp(799)
 */
export function useCountUp(value, { duration = 900, decimals = 0 } = {}) {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplay(target)
      return
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduce) {
      setDisplay(target)
      fromRef.current = target
      return
    }
    cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const from = fromRef.current
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      setDisplay(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  const factor = Math.pow(10, decimals)
  return Math.round(display * factor) / factor
}

/** Triggerable boolean for one-shot keyframe animations (e.g., wiggle on save). */
export function useFlash(ms = 400) {
  const [on, setOn] = useState(false)
  const trigger = () => {
    setOn(false)
    requestAnimationFrame(() => setOn(true))
    setTimeout(() => setOn(false), ms)
  }
  return [on, trigger]
}
