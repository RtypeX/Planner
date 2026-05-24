// Function-calling schema + appliers for the AI chatbot.
//
// The bot can never mutate state directly; it produces "drafts" that the user
// confirms inside the chat panel. Each tool below has:
//   - declaration: Gemini function-calling schema sent in `tools[0].functionDeclarations`
//   - apply: takes the AppData context and the validated args, performs the
//            mutation, and returns a description for the activity log.
//   - summarize: short human-readable preview shown before confirmation.

import { uid } from './storage'
import { defaultPhoneModels, DEFAULT_CARDCASH_RATE } from './defaults'
import { todayISO, plusDaysISO } from './calc'

const cycleSchema = {
  type: 'object',
  properties: {
    model: { type: 'string', description: 'Phone model name, e.g. "iPhone 16e"' },
    quantity: { type: 'number' },
    costPerUnit: { type: 'number', description: 'What you paid per phone, USD' },
    mobileXCost: { type: 'number', description: 'Per-unit MobileX fee, USD (default 8)' },
    orderDate: { type: 'string', description: 'YYYY-MM-DD' },
    expectedDelivery: { type: 'string', description: 'YYYY-MM-DD; defaults to orderDate + 2 days' },
    tradeInValue: { type: 'number', description: 'Gift card value per phone' },
    cardCashRate: { type: 'number', description: '0–1, default 0.77' },
    status: { type: 'string', enum: ['Ordered', 'Shipped', 'Traded', 'Submitted', 'Paid'] },
    trackingNumber: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['model', 'quantity'],
}

const workoutSchema = {
  type: 'object',
  properties: {
    date: { type: 'string', description: 'YYYY-MM-DD' },
    type: { type: 'string', enum: ['Run', 'Push-ups', 'Sit-ups', 'Mixed'] },
    runDistance: { type: 'number', description: 'Miles' },
    runSeconds: { type: 'number', description: 'Total seconds for the run' },
    pushups: { type: 'number' },
    situps: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['date', 'type'],
}

const milestoneSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    date: { type: 'string', description: 'YYYY-MM-DD' },
    category: { type: 'string', enum: ['Arbitrage', 'Fitness', 'Military', 'Life'] },
    status: { type: 'string', enum: ['Not started', 'In progress', 'Done'] },
    notes: { type: 'string' },
  },
  required: ['title', 'date'],
}

const studySchema = {
  type: 'object',
  properties: {
    date: { type: 'string', description: 'YYYY-MM-DD' },
    duration: { type: 'number', description: 'Minutes' },
    section: { type: 'string', description: 'ASVAB section name' },
  },
  required: ['date', 'duration'],
}

const practiceSchema = {
  type: 'object',
  properties: {
    date: { type: 'string', description: 'YYYY-MM-DD' },
    score: { type: 'number', description: 'AFQT, 1–99' },
    notes: { type: 'string' },
    g: { type: 'number', description: 'General line score' },
    m: { type: 'number', description: 'Mechanical line score' },
    a: { type: 'number', description: 'Administrative line score' },
    e: { type: 'number', description: 'Electronics line score' },
  },
  required: ['date', 'score'],
}

export const AI_TOOLS = [
  {
    name: 'add_cycle',
    description: 'Create a new iPhone arbitrage cycle. Use this whenever the user describes a phone purchase, trade-in, or CardCash submission.',
    parameters: cycleSchema,
    summarize: (args) => `Add cycle: ${args.model} × ${args.quantity || 1} (${args.status || 'Ordered'})`,
    apply: ({ setCycles, phoneModels }, args) => {
      const order = args.orderDate || todayISO()
      const cycle = {
        id: uid(),
        model: args.model || (phoneModels?.[0]?.name) || 'iPhone 16e',
        quantity: Math.max(1, Number(args.quantity) || 1),
        costPerUnit: Number(args.costPerUnit) || 0,
        mobileXCost: Number(args.mobileXCost) || 8,
        orderDate: order,
        expectedDelivery: args.expectedDelivery || plusDaysISO(order, 2),
        tradeInValue: Number(args.tradeInValue) || 0,
        cardCashRate: Number(args.cardCashRate) || DEFAULT_CARDCASH_RATE,
        status: args.status || 'Ordered',
        trackingNumber: args.trackingNumber || '',
        carrier: '',
        trackingStatus: '',
        trackingCode: '',
        trackingLastUpdated: '',
        trackingRefreshedAt: '',
        actualDelivery: '',
        cardId: '',
        cardCashSubmittedDate: '',
        cardCashPaidDate: '',
        actualPayout: '',
        notes: args.notes || '',
      }
      setCycles((prev) => [cycle, ...prev])
      return `Added ${cycle.model} × ${cycle.quantity}`
    },
  },
  {
    name: 'log_workout',
    description: 'Add a workout entry. The user might say "ran 1.5 in 13:40" or "did 45 push-ups today".',
    parameters: workoutSchema,
    summarize: (args) => {
      const bits = []
      if (args.runSeconds) bits.push(`run ${Math.floor(args.runSeconds / 60)}:${String(args.runSeconds % 60).padStart(2, '0')}`)
      if (args.pushups) bits.push(`${args.pushups} push-ups`)
      if (args.situps) bits.push(`${args.situps} sit-ups`)
      return `Log ${args.type}${bits.length ? ' — ' + bits.join(', ') : ''} on ${args.date}`
    },
    apply: ({ setWorkouts }, args) => {
      const w = {
        id: uid(),
        date: args.date || todayISO(),
        type: args.type || 'Mixed',
        runDistance: args.runDistance ?? '',
        runSeconds: args.runSeconds ?? '',
        pushups: args.pushups ?? '',
        situps: args.situps ?? '',
        notes: args.notes || '',
      }
      setWorkouts((prev) => [...prev, w])
      return `Logged ${w.type} on ${w.date}`
    },
  },
  {
    name: 'add_milestone',
    description: 'Add a milestone to the timeline.',
    parameters: milestoneSchema,
    summarize: (args) => `Add milestone "${args.title}" on ${args.date}`,
    apply: ({ setMilestones }, args) => {
      const m = {
        id: uid(),
        title: args.title,
        date: args.date,
        category: args.category || 'Life',
        status: args.status || 'Not started',
        notes: args.notes || '',
      }
      setMilestones((prev) => [...prev, m])
      return `Added milestone "${m.title}"`
    },
  },
  {
    name: 'log_study',
    description: 'Log an ASVAB study session.',
    parameters: studySchema,
    summarize: (args) => `Study: ${args.duration} min · ${args.section || 'general'} on ${args.date}`,
    apply: ({ asvab, setAsvab }, args) => {
      setAsvab({
        ...asvab,
        studySessions: [
          ...(asvab.studySessions || []),
          { id: uid(), date: args.date, duration: Number(args.duration) || 0, section: args.section || '' },
        ],
      })
      return `Logged ${args.duration} min of ASVAB study`
    },
  },
  {
    name: 'log_practice_test',
    description: 'Log an ASVAB practice test result.',
    parameters: practiceSchema,
    summarize: (args) => `Practice test: AFQT ${args.score} on ${args.date}`,
    apply: ({ asvab, setAsvab }, args) => {
      setAsvab({
        ...asvab,
        practiceTests: [
          ...(asvab.practiceTests || []),
          {
            id: uid(),
            date: args.date,
            score: Number(args.score) || 0,
            notes: args.notes || '',
            lines: {
              G: args.g ?? null,
              M: args.m ?? null,
              A: args.a ?? null,
              E: args.e ?? null,
            },
          },
        ],
      })
      return `Logged practice test (${args.score})`
    },
  },
  {
    name: 'update_balance',
    description: 'Update liquid cash or personal savings balances.',
    parameters: {
      type: 'object',
      properties: {
        liquidCash: { type: 'number' },
        personalSavings: { type: 'number' },
      },
    },
    summarize: (args) => `Set balances: ${Object.entries(args).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    apply: ({ balance, setBalance }, args) => {
      const next = { ...balance }
      if (args.liquidCash != null) next.liquidCash = Number(args.liquidCash)
      if (args.personalSavings != null) next.personalSavings = Number(args.personalSavings)
      setBalance(next)
      return 'Updated balances'
    },
  },
]

export const AI_TOOL_BY_NAME = Object.fromEntries(AI_TOOLS.map((t) => [t.name, t]))

/** Build the Gemini tools[] payload from AI_TOOLS. */
export function buildGeminiTools() {
  return [{
    functionDeclarations: AI_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  }]
}

/** Compact serialization of app state for the system prompt. Keeps token cost bounded. */
export function summarizeState({ cycles, workouts, milestones, balance, asvab, phoneModels }) {
  const recentCycles = (cycles || []).slice(0, 8).map((c) => ({
    model: c.model, qty: c.quantity, status: c.status,
    orderDate: c.orderDate, paid: c.cardCashPaidDate || null,
  }))
  const recentWorkouts = (workouts || []).slice(-5).map((w) => ({
    date: w.date, type: w.type,
    runSeconds: w.runSeconds || null,
    pushups: w.pushups || null,
    situps: w.situps || null,
  }))
  return {
    today: todayISO(),
    phoneModels: (phoneModels || defaultPhoneModels()).map((m) => ({
      name: m.name, cost: m.cost, mobileX: m.mobileX, tradeIn: m.tradeIn,
    })),
    recentCycles,
    recentWorkouts,
    upcomingMilestones: (milestones || [])
      .filter((m) => m.status !== 'Done')
      .slice(0, 5)
      .map((m) => ({ title: m.title, date: m.date, category: m.category })),
    balance,
    asvabTarget: asvab?.target || 80,
    bestAfqt: Math.max(0, ...((asvab?.practiceTests) || []).map((t) => Number(t.score) || 0)),
  }
}
