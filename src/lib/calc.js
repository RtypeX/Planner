import { addDays, format, parseISO, isValid } from 'date-fns'
import { PHONE_MODELS, DEFAULT_CARDCASH_RATE, PRIVACY_USES_PER_CARD } from './defaults'

export function fmtCurrency(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '$0'
  const v = Number(n)
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function fmtNum(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0'
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function fmtDate(d) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? parseISO(d) : d
  if (!isValid(dt)) return '—'
  return format(dt, 'MMM d, yyyy')
}

export function fmtDateShort(d) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? parseISO(d) : d
  if (!isValid(dt)) return '—'
  return format(dt, 'MMM d')
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function plusDaysISO(iso, days) {
  if (!iso) return ''
  try {
    return format(addDays(parseISO(iso), days), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function secondsToMmss(secs) {
  if (secs === null || secs === undefined || Number.isNaN(Number(secs))) return '—'
  const s = Math.max(0, Math.round(Number(secs)))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

export function mmssToSeconds(s) {
  if (!s) return null
  const trimmed = String(s).trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  const m = trimmed.match(/^(\d+):(\d{1,2})$/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

// ---- Arbitrage ----

export function expectedPayout(cycle) {
  const tradeIn = Number(cycle.tradeInValue || 0)
  const qty = Number(cycle.quantity || 0)
  const rate = Number(cycle.cardCashRate || DEFAULT_CARDCASH_RATE)
  return tradeIn * qty * rate
}

export function actualPayout(cycle) {
  if (cycle.actualPayout !== '' && cycle.actualPayout !== null && cycle.actualPayout !== undefined) {
    return Number(cycle.actualPayout) || 0
  }
  return expectedPayout(cycle)
}

export function totalCost(cycle) {
  const qty = Number(cycle.quantity || 0)
  const cost = Number(cycle.costPerUnit || 0)
  const mx = Number(cycle.mobileXCost || 0)
  return qty * (cost + mx)
}

export function netProfit(cycle) {
  if (cycle.status === 'Paid') return actualPayout(cycle) - totalCost(cycle)
  return expectedPayout(cycle) - totalCost(cycle)
}

export function isPending(cycle) {
  // Operating capital = money out the door, not yet paid back
  return cycle.status !== 'Paid'
}

export function operatingCapital(cycles) {
  return cycles.filter(isPending).reduce((sum, c) => sum + totalCost(c), 0)
}

export function pendingCardCash(cycles) {
  // Money submitted but not yet paid out
  return cycles
    .filter((c) => c.status === 'Submitted' || c.status === 'Traded' || c.status === 'Shipped')
    .reduce((sum, c) => sum + expectedPayout(c), 0)
}

export function totalAllTimeProfit(cycles) {
  return cycles.reduce((sum, c) => sum + netProfit(c), 0)
}

export function paidProfit(cycles) {
  return cycles.filter((c) => c.status === 'Paid').reduce((sum, c) => sum + netProfit(c), 0)
}

export function cyclesCompleted(cycles) {
  return cycles.filter((c) => c.status === 'Paid').length
}

export function buildNewCycle(model = 'iPhone 16e', qty = 1) {
  const m = PHONE_MODELS[model] || PHONE_MODELS['iPhone 16e']
  const orderDate = todayISO()
  return {
    id: '',
    model,
    quantity: qty,
    costPerUnit: m.cost,
    mobileXCost: m.mobileX,
    orderDate,
    expectedDelivery: plusDaysISO(orderDate, 2),
    tradeInValue: m.tradeIn,
    cardCashRate: DEFAULT_CARDCASH_RATE,
    status: 'Ordered',
    cardCashSubmittedDate: '',
    cardCashPaidDate: '',
    actualPayout: '',
    notes: '',
    cardId: '',
    // Shipment tracking (UPS / USPS / FedEx)
    trackingNumber: '',
    carrier: '',
    trackingStatus: '',
    trackingCode: '',
    trackingLastUpdated: '', // ISO timestamp from carrier
    trackingRefreshedAt: '', // ISO timestamp of our last fetch
    actualDelivery: '',      // ISO date when carrier reported delivered
  }
}

// ---- Privacy cards ----

export function cardUsesRemaining(card, cycles) {
  const used = cycles
    .filter((c) => c.cardId === card.id)
    .reduce((sum, c) => sum + Number(c.quantity || 0), 0)
  return Math.max(0, PRIVACY_USES_PER_CARD - used)
}

export function cardsUsedThisMonth(cycles) {
  const now = new Date()
  const yyyymm = format(now, 'yyyy-MM')
  const ids = new Set()
  cycles.forEach((c) => {
    if (!c.cardId || !c.orderDate) return
    if (c.orderDate.startsWith(yyyymm)) ids.add(c.cardId)
  })
  return ids.size
}

// ---- Projector ----

export function projectCycles(startingCash, phonesPerCycle, model, cardCashRate, count = 5) {
  const m = PHONE_MODELS[model] || PHONE_MODELS['iPhone 16e']
  const costPer = m.cost + m.mobileX
  const profitPer = m.tradeIn * cardCashRate - costPer
  let cash = Number(startingCash) || 0
  const rows = []
  for (let i = 1; i <= count; i++) {
    const phones = Math.min(phonesPerCycle, Math.floor(cash / costPer))
    const deployed = phones * costPer
    const expectedProfit = phones * profitPer
    const ending = cash - deployed + (deployed + expectedProfit) // capital returns + profit
    rows.push({
      cycle: i,
      phones,
      capitalDeployed: deployed,
      expectedProfit,
      endingCash: ending,
    })
    cash = ending
  }
  return rows
}
