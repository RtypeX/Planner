import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_KEYS, useLocalStorage, resetAllStorage } from './storage'
import {
  defaultBalance,
  defaultFitnessBaselines,
  defaultGoals,
  defaultMilestones,
  defaultAsvab,
  defaultSettings,
  defaultPhoneModels,
} from './defaults'
import { fetchTracking, detectCarrier } from './tracking'

const AppDataContext = createContext(null)

/** Migrate the legacy object-form phoneModels to the new array form. */
function migratePhoneModels(stored) {
  if (Array.isArray(stored) && stored.length) return stored
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    const out = Object.entries(stored).map(([name, m], i) => ({
      id: `pm-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      cost: Number(m?.cost || 0),
      mobileX: Number(m?.mobileX || 0),
      tradeIn: Number(m?.tradeIn || 0),
    }))
    return out.length ? out : defaultPhoneModels()
  }
  return defaultPhoneModels()
}

export function AppDataProvider({ children }) {
  const [cycles, setCycles] = useLocalStorage(STORAGE_KEYS.cycles, [])
  const [privacyCards, setPrivacyCards] = useLocalStorage(STORAGE_KEYS.privacyCards, [])
  const [balance, setBalance] = useLocalStorage(STORAGE_KEYS.balance, defaultBalance())
  const [workouts, setWorkouts] = useLocalStorage(STORAGE_KEYS.workouts, [])
  const [fitnessBaselines, setFitnessBaselines] = useLocalStorage(
    STORAGE_KEYS.fitnessBaselines,
    defaultFitnessBaselines(),
  )
  const [milestones, setMilestones] = useLocalStorage(STORAGE_KEYS.milestones, defaultMilestones())
  const [asvab, setAsvab] = useLocalStorage(STORAGE_KEYS.asvab, defaultAsvab())
  const [goals, setGoals] = useLocalStorage(STORAGE_KEYS.goals, defaultGoals())
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, defaultSettings())
  const [phoneModelsRaw, setPhoneModels] = useLocalStorage(STORAGE_KEYS.phoneModels, defaultPhoneModels())
  const phoneModels = useMemo(() => migratePhoneModels(phoneModelsRaw), [phoneModelsRaw])

  // Toast queue (single-slot for now; new toast replaces the old)
  const [toast, setToast] = useState(null)
  const toastSeq = useRef(0)
  const showToast = useCallback((next) => {
    if (!next) return setToast(null)
    toastSeq.current += 1
    setToast({ id: toastSeq.current, ...next })
  }, [])

  // Refresh tracking for a single cycle
  const refreshTracking = useCallback(
    async (cycleId) => {
      const cycle = cycles.find((c) => c.id === cycleId)
      if (!cycle) throw new Error('Cycle not found')
      if (!cycle.trackingNumber) throw new Error('No tracking number on this cycle')
      const carrier = cycle.carrier || detectCarrier(cycle.trackingNumber) || 'UPS'
      const data = await fetchTracking({
        proxyUrl: settings.trackingProxyUrl,
        trackingNumber: cycle.trackingNumber,
        carrier,
      })
      const patch = {
        carrier,
        trackingStatus: data.status || cycle.trackingStatus || '',
        trackingCode: data.code || cycle.trackingCode || '',
        trackingLastUpdated: data.lastUpdate || cycle.trackingLastUpdated || '',
        trackingRefreshedAt: new Date().toISOString(),
        actualDelivery: data.deliveredAt
          ? data.deliveredAt.slice(0, 10)
          : cycle.actualDelivery || '',
      }
      const code = (data.code || '').toUpperCase()
      const inTransit = code === 'I' || code === 'IT' || code === 'O' || code === 'P' ||
        /in transit|out for delivery|picked up/i.test(data.status || '')
      const delivered = code === 'D' || /delivered/i.test(data.status || '')
      let nextStatus = cycle.status
      if (cycle.status === 'Ordered' && (inTransit || delivered)) nextStatus = 'Shipped'

      setCycles((prev) =>
        prev.map((c) => (c.id === cycleId ? { ...c, ...patch, status: nextStatus } : c)),
      )
      return { cycle: { ...cycle, ...patch, status: nextStatus }, raw: data }
    },
    [cycles, setCycles, settings.trackingProxyUrl],
  )

  // Refresh every cycle that has a tracking number, sequentially
  const refreshAllTracking = useCallback(async () => {
    const targets = cycles.filter((c) => c.trackingNumber && c.status !== 'Paid')
    if (targets.length === 0) {
      showToast({ type: 'info', message: 'No cycles with tracking numbers to refresh.' })
      return { updated: 0, failed: 0 }
    }
    if (!settings.trackingProxyUrl) {
      showToast({
        type: 'error',
        title: 'Tracking API not configured',
        message: 'Open Settings → Tracking API and paste your proxy URL.',
      })
      return { updated: 0, failed: 0 }
    }
    let updated = 0
    let failed = 0
    let lastError = ''
    for (const c of targets) {
      try {
        await refreshTracking(c.id)
        updated += 1
      } catch (err) {
        failed += 1
        lastError = err?.message || String(err)
      }
    }
    if (failed === 0) {
      showToast({
        type: 'success',
        title: 'Tracking refreshed',
        message: `Updated ${updated} cycle${updated === 1 ? '' : 's'}.`,
      })
    } else {
      showToast({
        type: failed === targets.length ? 'error' : 'info',
        title: `Tracking: ${updated} updated, ${failed} failed`,
        message: lastError ? `Last error: ${lastError}` : '',
      })
    }
    return { updated, failed }
  }, [cycles, settings.trackingProxyUrl, refreshTracking, showToast])

  // Apply theme on settings change
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [settings.theme])

  const resetAll = () => {
    resetAllStorage()
    setCycles([])
    setPrivacyCards([])
    setBalance(defaultBalance())
    setWorkouts([])
    setFitnessBaselines(defaultFitnessBaselines())
    setMilestones(defaultMilestones())
    setAsvab(defaultAsvab())
    setGoals(defaultGoals())
    setSettings(defaultSettings())
    setPhoneModels(defaultPhoneModels())
  }

  const value = useMemo(
    () => ({
      cycles, setCycles,
      privacyCards, setPrivacyCards,
      balance, setBalance,
      workouts, setWorkouts,
      fitnessBaselines, setFitnessBaselines,
      milestones, setMilestones,
      asvab, setAsvab,
      goals, setGoals,
      settings, setSettings,
      phoneModels, setPhoneModels,
      resetAll,
      // tracking
      refreshTracking,
      refreshAllTracking,
      // toast
      toast, showToast,
    }),
    [
      cycles, privacyCards, balance, workouts, fitnessBaselines, milestones,
      asvab, goals, settings, phoneModels, refreshTracking, refreshAllTracking, toast, showToast,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
