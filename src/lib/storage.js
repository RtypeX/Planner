import { useEffect, useRef, useState } from 'react'

export const STORAGE_KEYS = {
  cycles: 'dylan_cycles',
  privacyCards: 'dylan_privacy_cards',
  balance: 'dylan_balance',
  workouts: 'dylan_workouts',
  fitnessBaselines: 'dylan_fitness_baselines',
  milestones: 'dylan_milestones',
  asvab: 'dylan_asvab',
  goals: 'dylan_goals',
  settings: 'dylan_settings',
  phoneModels: 'dylan_phone_models',
  meta: 'dylan_meta', // last-backup timestamp, etc.
}

// ─── Write-failure listeners ────────────────────────────────────────────
// Subscribers get notified when a write fails (quota, security policy, etc.)
// so the UI can surface a persistent banner instead of swallowing the error.
const writeFailureListeners = new Set()
export function onStorageFailure(fn) {
  writeFailureListeners.add(fn)
  return () => writeFailureListeners.delete(fn)
}
function notifyFailure(err, key) {
  writeFailureListeners.forEach((fn) => {
    try { fn(err, key) } catch { /* ignore */ }
  })
}

export function loadFromStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null || raw === undefined) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load', key, e)
    return fallback
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save', key, e)
    notifyFailure(e, key)
  }
}

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => loadFromStorage(key, defaultValue))
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      // Persist defaults on first load if nothing was stored
      if (loadFromStorage(key, undefined) === undefined) {
        saveToStorage(key, value)
      }
      return
    }
    saveToStorage(key, value)
  }, [key, value])

  return [value, setValue]
}

export function resetAllStorage() {
  Object.values(STORAGE_KEYS).forEach((k) => {
    try { window.localStorage.removeItem(k) } catch {}
  })
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
