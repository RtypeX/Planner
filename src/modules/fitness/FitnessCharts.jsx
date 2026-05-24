import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
  AreaChart, Area,
} from 'recharts'
import { Activity, Timer } from 'lucide-react'
import SectionHeader from '../../components/ui/SectionHeader'
import EmptyState from '../../components/ui/EmptyState'
import { useAppData } from '../../lib/AppData'
import { BMT_TARGETS } from '../../lib/defaults'
import { secondsToMmss } from '../../lib/calc'
import { format, parseISO } from 'date-fns'

export default function FitnessCharts() {
  const { workouts, settings } = useAppData()
  const isDark = settings.theme === 'dark'
  const grid = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'
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

  const tooltipStyle = {
    background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${grid}`,
    borderRadius: 12,
    fontSize: 12,
    boxShadow: '0 8px 24px -8px rgba(0,0,0,0.2)',
    padding: 10,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card-padded">
        <SectionHeader
          icon={Timer}
          accent="brand"
          title="Run time"
          sub={`Lower is better — target ${secondsToMmss(BMT_TARGETS.runSeconds)}.`}
        />
        <div className="h-64">
          {runData.length === 0 ? (
            <EmptyState icon={Timer} title="No runs logged" description="Log a 1.5-mile run to start tracking pace." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={runData} margin={{ top: 5, right: 10, bottom: 0, left: -5 }}>
                <defs>
                  <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b66ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b66ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} />
                <YAxis
                  stroke={text} fontSize={11} tick={{ fill: text }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => secondsToMmss(v)}
                  domain={['dataMin - 30', 'dataMax + 30']}
                  reversed
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [secondsToMmss(v), 'Time']}
                  cursor={{ stroke: grid, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <ReferenceLine
                  y={BMT_TARGETS.runSeconds}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: 'Target', fill: '#10b981', fontSize: 10, position: 'right' }}
                />
                <Area type="monotone" dataKey="seconds" stroke="#3b66ff" strokeWidth={2.5} fill="url(#runGrad)" dot={{ r: 3, fill: '#3b66ff', stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card-padded">
        <SectionHeader
          icon={Activity}
          accent="violet"
          title="Strength"
          sub="Higher is better — dashed lines = goals."
        />
        <div className="h-64">
          {strengthData.length === 0 ? (
            <EmptyState icon={Activity} title="No reps logged" description="Log push-ups or sit-ups to see progress here." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthData} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} />
                <YAxis stroke={text} fontSize={11} tick={{ fill: text }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: grid, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                <ReferenceLine y={BMT_TARGETS.pushupsGoal} stroke="#8b5cf6" strokeDasharray="4 4" />
                <ReferenceLine y={BMT_TARGETS.situpsGoal} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="pushups" name="Push-ups" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="situps" name="Sit-ups" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
