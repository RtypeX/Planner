import { Map as MapIcon } from 'lucide-react'
import Timeline from './Timeline'
import AsvabTracker from './AsvabTracker'

export default function TimelineModule() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="animate-slide-down">
        <div className="page-eyebrow">
          <MapIcon size={11} /> Timeline
        </div>
        <h1 className="page-title">The path to BMT</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
          Big rocks · ASVAB prep · countdowns
        </p>
      </header>
      <Timeline />
      <AsvabTracker />
    </div>
  )
}
