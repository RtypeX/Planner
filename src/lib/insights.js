// Cross-module helpers for the Home dashboard and command palette.

import { differenceInCalendarDays, parseISO, isValid, format, subDays, isAfter } from 'date-fns'
import { totalCost, expectedPayout, netProfit, cyclesCompleted, totalAllTimeProfit } from './calc'

/** Cycles with a tracking number that aren't paid yet. Sorted by expected delivery (soonest first). */
export function getActiveShipments(cycles) {
  return cycles
    .filter((c) => c.trackingNumber && c.status !== 'Paid')
    .sort((a, b) => {
      const da = a.actualDelivery || a.expectedDelivery || ''
      const db = b.actualDelivery || b.expectedDelivery || ''
      return da.localeCompare(db)
    })
}

/** Up to N upcoming, non-Done milestones, sorted by date ascending. */
export function getNextMilestones(milestones, n = 3) {
  const today = new Date()
  return milestones
    .filter((m) => m.status !== 'Done')
    .map((m) => {
      const d = m.date ? parseISO(m.date) : null
      const days = d && isValid(d) ? differenceInCalendarDays(d, today) : null
      return { ...m, days }
    })
    .filter((m) => m.days !== null)
    .sort((a, b) => a.days - b.days)
    .slice(0, n)
}

/**
 * Stats for the last 7 days (rolling).
 *
 * Each metric uses its own date field — e.g. cycles paid this week filter on
 * cardCashPaidDate, not orderDate. (Earlier versions filtered everything by
 * orderDate first which silently undercounted.)
 */
export function getWeekStats(cycles, workouts) {
  const cutoff = subDays(new Date(), 7)
  const after = (iso) => {
    if (!iso) return false
    try { return isAfter(parseISO(iso), cutoff) } catch { return false }
  }

  const cyclesAdded = cycles.filter((c) => after(c.orderDate)).length
  const cyclesPaidThisWeek = cycles.filter((c) => c.status === 'Paid' && after(c.cardCashPaidDate)).length
  const recentWorkouts = workouts.filter((w) => after(w.date)).length

  // Profit added = sum of net profit from cycles whose status changed *to*
  // a profit-realizing state in the last 7 days. We approximate with
  // cardCashPaidDate (realized) plus orderDate-week pending profit.
  const realized = cycles
    .filter((c) => c.status === 'Paid' && after(c.cardCashPaidDate))
    .reduce((sum, c) => sum + netProfit(c), 0)
  const newPending = cycles
    .filter((c) => c.status !== 'Paid' && after(c.orderDate))
    .reduce((sum, c) => sum + netProfit(c), 0)

  return {
    cyclesAdded,
    cyclesPaid: cyclesPaidThisWeek,
    workouts: recentWorkouts,
    profitDelta: realized + newPending,
  }
}

/** Track personal bests across the workout log. Lower is better for run time. */
export function getPersonalBests(workouts) {
  const runTimes = workouts.map((w) => Number(w.runSeconds || 0)).filter((s) => s > 0)
  const pushups = workouts.map((w) => Number(w.pushups || 0)).filter((n) => n > 0)
  const situps = workouts.map((w) => Number(w.situps || 0)).filter((n) => n > 0)
  return {
    bestRunSeconds: runTimes.length ? Math.min(...runTimes) : null,
    bestPushups: pushups.length ? Math.max(...pushups) : 0,
    bestSitups: situps.length ? Math.max(...situps) : 0,
  }
}

/** Returns true if `workout` is the all-time personal best on any tracked metric. */
export function isPersonalBest(workout, allWorkouts) {
  const others = allWorkouts.filter((w) => w.id !== workout.id)
  const pb = getPersonalBests(others)
  const flags = {}
  if (Number(workout.runSeconds) > 0 && (pb.bestRunSeconds === null || workout.runSeconds < pb.bestRunSeconds)) flags.run = true
  if (Number(workout.pushups) > 0 && workout.pushups > pb.bestPushups) flags.pushups = true
  if (Number(workout.situps) > 0 && workout.situps > pb.bestSitups) flags.situps = true
  return flags
}

/**
 * Workout streak that tolerates "today not logged yet". Counts consecutive
 * days ending at today *or* yesterday — whichever is the latest day with a
 * logged workout. So a 12-day streak still reads as 12 first thing in the
 * morning before you've worked out today, instead of resetting to 0.
 */
export function getWorkoutStreak(workouts) {
  const dates = new Set(workouts.map((w) => w.date).filter(Boolean))
  if (dates.size === 0) return { streak: 0, includesToday: false, atRisk: false }
  const todayIso = new Date().toISOString().slice(0, 10)
  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const yestIso = yest.toISOString().slice(0, 10)

  // Find the latest logged day to anchor the count from.
  let cursor
  let includesToday = false
  if (dates.has(todayIso)) {
    cursor = new Date(todayIso)
    includesToday = true
  } else if (dates.has(yestIso)) {
    cursor = new Date(yestIso)
  } else {
    return { streak: 0, includesToday: false, atRisk: false }
  }

  let streak = 0
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return { streak, includesToday, atRisk: !includesToday }
}

/**
 * Pick the single most urgent thing for the home hero card.
 * Priority order:
 *   1. Shipment delivering today or already overdue
 *   2. Milestone in the next 7 days
 *   3. PC goal still incomplete
 *   4. Default: a "keep going" prompt
 */
export function pickHeroFocus({ cycles, milestones, profit, pcGoal }) {
  const shipments = getActiveShipments(cycles)
  const today = new Date()

  // 1. shipment urgency
  for (const c of shipments) {
    const d = c.actualDelivery || c.expectedDelivery
    if (!d) continue
    try {
      const days = differenceInCalendarDays(parseISO(d), today)
      if (days <= 1) {
        return {
          kind: 'shipment',
          tone: days < 0 ? 'rose' : 'amber',
          title: days < 0
            ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
            : days === 0 ? 'Delivering today' : 'Delivers tomorrow',
          subtitle: `${c.model} × ${c.quantity} · ${c.trackingNumber}`,
          cycle: c,
        }
      }
    } catch {}
  }

  // 2. imminent milestone
  const upcoming = getNextMilestones(milestones, 1)[0]
  if (upcoming && upcoming.days <= 7 && upcoming.days >= 0) {
    return {
      kind: 'milestone',
      tone: 'brand',
      title: upcoming.days === 0
        ? `${upcoming.title} — today`
        : `${upcoming.title} in ${upcoming.days} day${upcoming.days === 1 ? '' : 's'}`,
      subtitle: format(parseISO(upcoming.date), 'EEEE, MMM d'),
      milestone: upcoming,
    }
  }

  // 3. PC goal in progress
  if (profit < pcGoal) {
    const pct = Math.max(0, Math.round((profit / pcGoal) * 100))
    return {
      kind: 'pc-goal',
      tone: 'brand',
      title: `PC goal · ${pct}% there`,
      subtitle: `$${Math.max(0, pcGoal - profit).toFixed(0)} to go`,
      pct,
    }
  }

  return {
    kind: 'default',
    tone: 'emerald',
    title: 'All systems go',
    subtitle: 'No pressing deadlines. Keep stacking wins.',
  }
}

/** Format a friendly greeting based on the current hour. */
export function greeting(name = 'Dylan') {
  const h = new Date().getHours()
  if (h < 5) return `Up late, ${name}`
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  if (h < 21) return `Good evening, ${name}`
  return `Late night, ${name}`
}
