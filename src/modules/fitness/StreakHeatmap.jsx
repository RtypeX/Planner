import { useMemo } from 'react'
import { useAppData } from '../../lib/AppData'
import { format, eachDayOfInterval, subDays, startOfWeek } from 'date-fns'
import { Flame } from 'lucide-react'

const WEEKS = 18 // ~ 4 months
const DAYS = WEEKS * 7

export default function StreakHeatmap() {
  const { workouts } = useAppData()

  const { grid, monthLabels, totals, currentStreak, longestStreak } = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(subDays(today, DAYS - 1), { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start, end: today })

    // Map of yyyy-MM-dd -> count
    const byDay = {}
    workouts.forEach((w) => {
      if (!w.date) return
      byDay[w.date] = (byDay[w.date] || 0) + 1
    })

    const cells = days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      return { date: d, key, count: byDay[key] || 0 }
    })

    // Build columns of 7 (Sun-Sat)
    const cols = []
    for (let i = 0; i < cells.length; i += 7) {
      cols.push(cells.slice(i, i + 7))
    }

    // Month labels per column (only show when month changes at top of column)
    const labels = cols.map((col, idx) => {
      const top = col[0]?.date
      if (!top) return ''
      if (idx === 0) return format(top, 'MMM')
      const prevTop = cols[idx - 1][0]?.date
      return prevTop && format(prevTop, 'MMM') !== format(top, 'MMM') ? format(top, 'MMM') : ''
    })

    // Streaks
    let cur = 0
    let longest = 0
    let running = 0
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].count > 0) {
        running += 1
        longest = Math.max(longest, running)
      } else {
        running = 0
      }
    }
    // current streak counts back from today
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].count > 0) cur += 1
      else break
    }

    const totalSessions = Object.values(byDay).reduce((s, n) => s + n, 0)
    const activeDays = Object.keys(byDay).length

    return {
      grid: cols,
      monthLabels: labels,
      totals: { totalSessions, activeDays },
      currentStreak: cur,
      longestStreak: longest,
    }
  }, [workouts])

  const cellColor = (count) => {
    if (count === 0) return 'bg-slate-200 dark:bg-slate-800'
    if (count === 1) return 'bg-emerald-300 dark:bg-emerald-800'
    if (count === 2) return 'bg-emerald-400 dark:bg-emerald-600'
    if (count === 3) return 'bg-emerald-500 dark:bg-emerald-500'
    return 'bg-emerald-600 dark:bg-emerald-400'
  }

  return (
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Workout streak
          </h3>
          <p className="section-sub">{totals.activeDays} active days · {totals.totalSessions} sessions logged</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Current</div>
            <div className="font-semibold tabular-nums">{currentStreak} d</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Longest</div>
            <div className="font-semibold tabular-nums">{longestStreak} d</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="px-4 sm:px-0 inline-block min-w-full">
          {/* month labels */}
          <div className="flex gap-1 mb-1 ml-5">
            {monthLabels.map((l, i) => (
              <div key={i} className="w-3 text-[10px] text-slate-500 dark:text-slate-400">{l}</div>
            ))}
          </div>
          <div className="flex gap-1">
            {/* day labels */}
            <div className="flex flex-col gap-1 mr-1 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="h-3 leading-3"></div>
              <div className="h-3 leading-3">M</div>
              <div className="h-3 leading-3"></div>
              <div className="h-3 leading-3">W</div>
              <div className="h-3 leading-3"></div>
              <div className="h-3 leading-3">F</div>
              <div className="h-3 leading-3"></div>
            </div>
            {grid.map((col, i) => (
              <div key={i} className="flex flex-col gap-1">
                {col.map((cell) => (
                  <div
                    key={cell.key}
                    title={`${cell.key} — ${cell.count} workout${cell.count === 1 ? '' : 's'}`}
                    className={`w-3 h-3 rounded-sm ${cellColor(cell.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-800" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
            <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
