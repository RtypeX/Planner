import { createContext, useContext, useEffect, useMemo } from 'react'
import { STORAGE_KEYS, useLocalStorage, resetAllStorage } from './storage'
import {
  defaultBalance,
  defaultFitnessBaselines,
  defaultGoals,
  defaultMilestones,
  defaultAsvab,
  defaultSettings,
} from './defaults'

const AppDataContext = createContext(null)

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
      resetAll,
    }),
    [cycles, privacyCards, balance, workouts, fitnessBaselines, milestones, asvab, goals, settings],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
