import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { useAppData } from '../../lib/AppData'
import { BMT_TARGETS } from '../../lib/defaults'
import { secondsToMmss } from '../../lib/calc'
import { format, parseISO } from 'date-fns'

export default function FitnessCharts() {
  const { workouts, settings } = useAppData()
  const isDark = settings.theme === 'dark'
  const grid = isDark ? '#334155' : '#e2e8f0'
  const text = isDark ? '#94a3b8' : '#64748b'

  const sorted = useMemo(
    () => [...workouts].filter((w) => w.date).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [workouts],
  )

  const runData = sorted
    .filter((w) => Number(w.runSeconds) > 0)
    .map((w) => ({
      date: w.date,
      label: format(parseISO(w.date), 'MMM d'),
      seconds: Number(w.runSeconds),
    }))

  const strengthData = sorted
    .filter((w) => Number(w.pushups) > 0 || Number(w.situps) > 0)
    .map((w) => ({
      date: w.date,
      label: format(parseISO(w.date), 'MMM d'),
      pushups: Number(w.pushups || 0),
      situps: Number(w.situps || 0),
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card-padded">
        <h3 className="section-title text-base">Run time improvement</h3>
        <p className="section-sub mb-3">Lower is better — target {secondsToMmss(BMT_TARGETS.runSeconds)}.</p>
        <div className="h-64">
          {runData.length === 0 ? (
            <EmptyChart text="Log a run to see progress." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={text} fontSize={12} tick={{ fill: text }} />
                <YAxis
                  stroke={text}
                  fontSize={12}
                  tick={{ fill: text }}
                  tickFormatter={(v) => secondsToMmss(v)}
                  domain={['dataMin - 30', 'dataMax + 30']}
                  reversed
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0f172a' : '#fff',
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [secondsToMmss(v), 'Time']}
                />
                <ReferenceLine y={BMT_TARGETS.runSeconds} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'BMT target', fill: '#10b981', fontSize: 11, position: 'right' }} />
                <Line type="monotone" dataKey="seconds" stroke="#357dff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card-padded">
        <h3 className="section-title text-base">Push-ups & sit-ups</h3>
        <p className="section-sub mb-3">Higher is better — solid lines = goals.</p>
        <div className="h-64">
          {strengthData.length === 0 ? (
            <EmptyChart text="Log push-ups or sit-ups to see progress." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={text} fontSize={12} tick={{ fill: text }} />
                <YAxis stroke={text} fontSize={12} tick={{ fill: text }} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#0f172a' : '#fff',
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={BMT_TARGETS.pushupsGoal} stroke="#8b5cf6" strokeDasharray="4 4" />
                <ReferenceLine y={BMT_TARGETS.situpsGoal} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="pushups" name="Push-ups" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="situps" name="Sit-ups" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ text }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
      {text}
    </div>
  )
}
