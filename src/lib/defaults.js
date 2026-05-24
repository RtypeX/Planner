// Default constants and seed data for Dylan's HQ

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
  }
}
