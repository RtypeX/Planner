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

/** Stats for the last 7 days (rolling). */
export function getWeekStats(cycles, workouts) {
  const cutoff = subDays(new Date(), 7)

  const recentCycles = cycles.filter((c) => {
    if (!c.orderDate) return false
    try { return isAfter(parseISO(c.orderDate), cutoff) } catch { return false }
  })
  const recentWorkouts = workouts.filter((w) => {
    if (!w.date) return false
    try { return isAfter(parseISO(w.date), cutoff) } catch { return false }
  })

  const profitDelta = recentCycles.reduce((sum, c) => sum + netProfit(c), 0)
  const cyclesPaidThisWeek = recentCycles.filter((c) => {
    if (c.status !== 'Paid') return false
    if (!c.cardCashPaidDate) return false
    try { return isAfter(parseISO(c.cardCashPaidDate), cutoff) } catch { return false }
  }).length

  return {
    cyclesAdded: recentCycles.length,
    cyclesPaid: cyclesPaidThisWeek,
    workouts: recentWorkouts.length,
    profitDelta,
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
