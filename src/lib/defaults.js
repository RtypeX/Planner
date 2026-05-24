// Default constants and seed data for Dylan's HQ

// Phone models — kept as a constant for the *seed* shape. Once the app loads,
// models live in localStorage as an array under `dylan_phone_models` and the
// user can add / edit / delete them in Settings. This object is just the
// initial default and a fallback if storage is empty/corrupt.
export const PHONE_MODELS = {
  'iPhone 16e': {
    label: 'iPhone 16e',
    cost: 171,
    tradeIn: 310,
    mobileX: 8,
  },
  'iPhone 13': {
    label: 'iPhone 13',
    cost: 116,
    tradeIn: 195,
    mobileX: 8,
  },
}

/** Default phone models in array form (the storage shape). */
export function defaultPhoneModels() {
  return [
    { id: 'pm-16e', name: 'iPhone 16e', cost: 171, mobileX: 8, tradeIn: 310 },
    { id: 'pm-13',  name: 'iPhone 13',  cost: 116, mobileX: 8, tradeIn: 195 },
  ]
}

/** Look up a phone model by name in the array form, with a graceful fallback. */
export function findModel(models, name) {
  const list = Array.isArray(models) && models.length ? models : defaultPhoneModels()
  return list.find((m) => m.name === name) || list[0]
}

export const DEFAULT_CARDCASH_RATE = 0.77
export const PC_GOAL = 799
export const PRE_ENLIST_GOAL = 2500
export const PRIVACY_USES_PER_CARD = 4
export const PRIVACY_MONTHLY_LIMIT = 12

export const CYCLE_STATUSES = ['Ordered', 'Shipped', 'Traded', 'Submitted', 'Paid']
export const CARD_STATUSES = ['Active', 'Maxed', 'Burned']
export const MILESTONE_CATEGORIES = ['Arbitrage', 'Fitness', 'Military', 'Life']
export const MILESTONE_STATUSES = ['Not started', 'In progress', 'Done']
export const WORKOUT_TYPES = ['Run', 'Push-ups', 'Sit-ups', 'Mixed']

// Privacy card cosmetics + brand options
export const CARD_TYPES = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Other']

export const CARD_COLORS = [
  { id: 'violet',  label: 'Violet',  gradient: 'from-violet-500 via-purple-600 to-indigo-700' },
  { id: 'brand',   label: 'Blue',    gradient: 'from-brand-500 via-brand-600 to-indigo-700' },
  { id: 'emerald', label: 'Emerald', gradient: 'from-emerald-500 via-teal-600 to-cyan-700' },
  { id: 'rose',    label: 'Rose',    gradient: 'from-rose-500 via-pink-600 to-purple-700' },
  { id: 'amber',   label: 'Amber',   gradient: 'from-amber-500 via-orange-600 to-rose-700' },
  { id: 'slate',   label: 'Slate',   gradient: 'from-slate-700 via-slate-800 to-slate-900' },
]

export const BMT_TARGETS = {
  runSeconds: 13 * 60 + 36, // 13:36
  pushupsMin: 42,
  pushupsGoal: 60,
  situpsMin: 38,
  situpsGoal: 50,
}

export const ASVAB_SECTIONS = [
  'General Science',
  'Arithmetic Reasoning',
  'Word Knowledge',
  'Paragraph Comprehension',
  'Mathematics Knowledge',
  'Electronics Information',
  'Auto Information',
  'Shop Information',
  'Mechanical Comprehension',
  'Assembling Objects',
]

// Pre-loaded milestones for the timeline
export function defaultMilestones() {
  return [
    {
      id: 'm-summer-2026',
      title: 'Arbitrage + PC + Permit',
      date: '2026-08-31',
      category: 'Life',
      status: 'In progress',
      notes: 'Run iPhone arbitrage cycles, hit $799 PC, get learner permit.',
    },
    {
      id: 'm-fall-2026',
      title: 'Recruiter + ASVAB + Fitness',
      date: '2026-11-30',
      category: 'Military',
      status: 'Not started',
      notes: 'Meet with USAF recruiter, take ASVAB, build fitness toward BMT standards.',
    },
    {
      id: 'm-spring-2027',
      title: 'MEPS + DEP + License + Graduation',
      date: '2027-05-31',
      category: 'Military',
      status: 'Not started',
      notes: 'Process MEPS, enter DEP, full license, finish high school.',
    },
    {
      id: 'm-summer-2027',
      title: 'Ship to Lackland + BMT',
      date: '2027-07-15',
      category: 'Military',
      status: 'Not started',
      notes: 'Ship to Lackland AFB for Basic Military Training.',
    },
  ]
}

export function defaultBalance() {
  return {
    liquidCash: 0,
    personalSavings: 0,
  }
}

export function defaultGoals() {
  return [
    { id: 'g-pc', name: 'PC Build', target: PC_GOAL, locked: true },
    { id: 'g-pre-enlist', name: 'Pre-enlistment Savings', target: PRE_ENLIST_GOAL, locked: false },
  ]
}

export function defaultFitnessBaselines() {
  return {
    runSeconds: null,
    pushups: null,
    situps: null,
    weight: null,
  }
}

export function defaultAsvab() {
  return {
    target: 80,
    practiceTests: [], // {id, date, score, notes}
    weakSections: [],
    studySessions: [], // {id, date, duration, section}
  }
}

export function defaultSettings() {
  return {
    theme: 'dark',
    trackingProxyUrl: '',
  }
}
