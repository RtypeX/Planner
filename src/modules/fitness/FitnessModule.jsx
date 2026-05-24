import { Dumbbell } from 'lucide-react'
import BmtStandards from './BmtStandards'
import WorkoutLog from './WorkoutLog'
import FitnessCharts from './FitnessCharts'
import StreakHeatmap from './StreakHeatmap'

export default function FitnessModule() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <header>
        <div className="page-eyebrow">
          <Dumbbell size={11} /> Fitness
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900 dark:text-white">
          BMT readiness
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Standards · workouts · streaks
        </p>
      </header>

      <BmtStandards />
      <WorkoutLog />
      <FitnessCharts />
      <StreakHeatmap />
    </div>
  )
}
