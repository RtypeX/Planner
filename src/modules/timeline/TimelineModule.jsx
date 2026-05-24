import Timeline from './Timeline'
import AsvabTracker from './AsvabTracker'

export default function TimelineModule() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Life Timeline</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Big rocks · ASVAB prep · the path to BMT</p>
      </header>
      <Timeline />
      <AsvabTracker />
    </div>
  )
}
