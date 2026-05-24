import BmtStandards from './BmtStandards'
import WorkoutLog from './WorkoutLog'
import FitnessCharts from './FitnessCharts'
import StreakHeatmap from './StreakHeatmap'

export default function FitnessModule() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fitness Tracker</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">BMT readiness · workouts · streaks</p>
      </header>

      <BmtStandards />
      <WorkoutLog />
      <FitnessCharts />
      <StreakHeatmap />
    </div>
  )
}
