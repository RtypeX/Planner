import { useMemo } from 'react'
import { useAppData } from '../../lib/AppData'
import { format, eachDayOfInterval, subDays, startOfWeek } from 'date-fns'
import { Flame } from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'

const WEEKS = 18
const DAYS = WEEKS * 7

export default function StreakHeatmap() {
  const { workouts } = useAppData()

  const { grid, monthLabels, totals, currentStreak, longestStreak } = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(subDays(today, DAYS - 1), { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start, end: today })

    const byDay = {}
    workouts.forEach((w) => {
      if (!w.date) return
      byDay[w.date] = (byDay[w.date] || 0) + 1
    })

    const cells = days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      return { date: d, key, count: byDay[key] || 0 }
    })

    const cols = []
    for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7))

    const labels = cols.map((col, idx) => {
      const top = col[0]?.date
      if (!top) return ''
      if (idx === 0) return format(top, 'MMM')
      const prevTop = cols[idx - 1][0]?.date
      return prevTop && format(prevTop, 'MMM') !== format(top, 'MMM') ? format(top, 'MMM') : ''
    })

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
    if (count === 0) return 'bg-slate-200/70 dark:bg-white/[0.05]'
    if (count === 1) return 'bg-emerald-300/80 dark:bg-emerald-700/70'
    if (count === 2) return 'bg-emerald-400 dark:bg-emerald-600'
    if (count === 3) return 'bg-emerald-500 dark:bg-emerald-500'
    return 'bg-emerald-600 dark:bg-emerald-400 ring-1 ring-emerald-300/60'
  }

  return (
    <section>
      <SectionHeader
        icon={Flame}
        accent="amber"
        eyebrow="Consistency"
        title="Workout streak"
        sub={`${totals.activeDays} active days · ${totals.totalSessions} sessions logged`}
        actions={
          <div className="flex items-center gap-3">
            <StreakStat label="Current" value={currentStreak} highlight={currentStreak > 0} />
            <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.06]" />
            <StreakStat label="Longest" value={longestStreak} />
          </div>
        }
      />

      <div className="card-padded">
        <div className="overflow-x-auto -mx-1">
          <div className="px-1 inline-block min-w-full" role="grid" aria-label={`Workout activity heatmap, ${totals.activeDays} active days, ${totals.totalSessions} sessions`}>
            <div className="flex gap-[3px] mb-1.5 ml-5">
              {monthLabels.map((l, i) => (
                <div key={i} className="w-[14px] text-[10px] font-semibold text-slate-500 dark:text-slate-400">{l}</div>
              ))}
            </div>
            <div className="flex gap-[3px]">
              <div className="flex flex-col gap-[3px] mr-1 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                <div className="h-[14px] leading-[14px]"></div>
                <div className="h-[14px] leading-[14px]">M</div>
                <div className="h-[14px] leading-[14px]"></div>
                <div className="h-[14px] leading-[14px]">W</div>
                <div className="h-[14px] leading-[14px]"></div>
                <div className="h-[14px] leading-[14px]">F</div>
                <div className="h-[14px] leading-[14px]"></div>
              </div>
              {grid.map((col, i) => (
                <div key={i} className="flex flex-col gap-[3px]" role="row">
                  {col.map((cell) => (
                    <div
                      key={cell.key}
                      title={`${cell.key} — ${cell.count} workout${cell.count === 1 ? '' : 's'}`}
                      aria-label={`${cell.key}, ${cell.count} workout${cell.count === 1 ? '' : 's'}`}
                      role="gridcell"
                      className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${cellColor(cell.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-slate-200/70 dark:bg-white/[0.05]" />
              <div className="w-3 h-3 rounded-sm bg-emerald-300/80 dark:bg-emerald-700/70" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StreakStat({ label, value, highlight }) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums tracking-tight ${highlight ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
        {value}<span className="text-sm font-bold opacity-60 ml-0.5">d</span>
      </div>
    </div>
  )
}
