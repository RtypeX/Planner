// Schema migrations for localStorage data.
// Bump CURRENT_SCHEMA_VERSION whenever the on-disk shape changes,
// then add a migration entry that goes from N → N+1.

import { STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage'
import { defaultPhoneModels } from './defaults'

export const SCHEMA_VERSION_KEY = 'dylan_schema_version'
export const CURRENT_SCHEMA_VERSION = 2

/** v0 → v1: convert legacy object-form phone models to the new array form. */
function migrateV0ToV1() {
  const stored = loadFromStorage(STORAGE_KEYS.phoneModels, null)
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    const next = Object.entries(stored).map(([name, m], i) => ({
      id: `pm-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      cost: Number(m?.cost || 0),
      mobileX: Number(m?.mobileX || 0),
      tradeIn: Number(m?.tradeIn || 0),
    }))
    saveToStorage(STORAGE_KEYS.phoneModels, next.length ? next : defaultPhoneModels())
  }
}

/** v1 → v2: ensure every cycle has all the tracking fields (introduced post-launch). */
function migrateV1ToV2() {
  const cycles = loadFromStorage(STORAGE_KEYS.cycles, null)
  if (!Array.isArray(cycles)) return
  const next = cycles.map((c) => ({
    trackingNumber: '',
    carrier: '',
    trackingStatus: '',
    trackingCode: '',
    trackingLastUpdated: '',
    trackingRefreshedAt: '',
    actualDelivery: '',
    cardId: '',
    notes: '',
    ...c,
  }))
  saveToStorage(STORAGE_KEYS.cycles, next)
}

const MIGRATIONS = [
  migrateV0ToV1, // index 0 = upgrade from v0 → v1
  migrateV1ToV2, // index 1 = upgrade from v1 → v2
]

/**
 * Run any pending migrations and bump the stored schema version.
 * Safe to call repeatedly; no-op if already current.
 */
export function runMigrations() {
  if (typeof window === 'undefined') return
  let current = Number(loadFromStorage(SCHEMA_VERSION_KEY, 0)) || 0

  // First-run heuristic: if no version stored *and* there's no existing
  // dylan_* key, this is a fresh install — fast-forward to current.
  if (current === 0 && !hasAnyAppData()) {
    saveToStorage(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION)
    return
  }

  while (current < CURRENT_SCHEMA_VERSION) {
    const fn = MIGRATIONS[current]
    if (!fn) break
    try {
      fn()
    } catch (e) {
      console.error(`Migration v${current} → v${current + 1} failed`, e)
      break
    }
    current += 1
    saveToStorage(SCHEMA_VERSION_KEY, current)
  }
}

function hasAnyAppData() {
  return Object.values(STORAGE_KEYS).some((key) => {
    try { return window.localStorage.getItem(key) !== null } catch { return false }
  })
}
