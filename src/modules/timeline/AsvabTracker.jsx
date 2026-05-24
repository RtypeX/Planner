import { useMemo, useState } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { ASVAB_SECTIONS } from '../../lib/defaults'
import ProgressBar from '../../components/ui/ProgressBar'
import { fmtDateShort, todayISO } from '../../lib/calc'

export default function AsvabTracker() {
  const { asvab, setAsvab } = useAppData()

  const setTarget = (target) => setAsvab({ ...asvab, target: parseInt(target || '0', 10) || 0 })

  // Practice tests
  const [testForm, setTestForm] = useState({ date: todayISO(), score: '', notes: '' })
  const addTest = () => {
    if (testForm.score === '') return
    setAsvab({
      ...asvab,
      practiceTests: [
        ...(asvab.practiceTests || []),
        { id: uid(), date: testForm.date, score: parseInt(testForm.score, 10), notes: testForm.notes },
      ],
    })
    setTestForm({ date: todayISO(), score: '', notes: '' })
  }
  const removeTest = (id) =>
    setAsvab({ ...asvab, practiceTests: (asvab.practiceTests || []).filter((t) => t.id !== id) })

  // Study sessions
  const [studyForm, setStudyForm] = useState({ date: todayISO(), duration: '', section: ASVAB_SECTIONS[0] })
  const addStudy = () => {
    if (!studyForm.duration) return
    setAsvab({
      ...asvab,
      studySessions: [
        ...(asvab.studySessions || []),
        { id: uid(), date: studyForm.date, duration: parseInt(studyForm.duration, 10), section: studyForm.section },
      ],
    })
    setStudyForm({ ...studyForm, duration: '' })
  }
  const removeStudy = (id) =>
    setAsvab({ ...asvab, studySessions: (asvab.studySessions || []).filter((s) => s.id !== id) })

  const toggleWeak = (section) => {
    const cur = new Set(asvab.weakSections || [])
    if (cur.has(section)) cur.delete(section)
    else cur.add(section)
    setAsvab({ ...asvab, weakSections: Array.from(cur) })
  }

  const tests = useMemo(() => [...(asvab.practiceTests || [])].sort((a, b) => (a.date < b.date ? 1 : -1)), [asvab.practiceTests])
  const studies = useMemo(() => [...(asvab.studySessions || [])].sort((a, b) => (a.date < b.date ? 1 : -1)), [asvab.studySessions])
  const bestScore = tests.reduce((m, t) => Math.max(m, Number(t.score || 0)), 0)
  const totalMinutes = studies.reduce((s, x) => s + Number(x.duration || 0), 0)
  const last = tests[0]

  return (
    <div className="card-padded">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2"><BookOpen size={18} /> ASVAB prep</h3>
          <p className="section-sub">Practice tests, weak sections, study log.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Target score</label>
          <input
            type="number"
            min="1"
            max="99"
            className="input w-20 text-sm"
            value={asvab.target ?? 80}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>

      {/* Score progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4">
          <div className="stat-label">Best score</div>
          <div className="stat-value">{bestScore || '—'}</div>
          <div className="mt-2">
            <ProgressBar value={bestScore} max={asvab.target || 80} color="brand" label={`Target ${asvab.target || 80}`} />
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4">
          <div className="stat-label">Last test</div>
          <div className="stat-value">{last?.score ?? '—'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{last ? fmtDateShort(last.date) : '—'}</div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4">
          <div className="stat-label">Study time</div>
          <div className="stat-value tabular-nums">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{studies.length} sessions</div>
        </div>
      </div>

      {/* Weak sections */}
      <div className="mb-5">
        <div className="font-semibold text-sm mb-2">Weak sections</div>
        <div className="flex flex-wrap gap-2">
          {ASVAB_SECTIONS.map((s) => {
            const active = (asvab.weakSections || []).includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleWeak(s)}
                className={`badge cursor-pointer transition-colors ${
                  active
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-700'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Practice tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="font-semibold text-sm mb-2">Practice tests</div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/60">
            <div className="grid grid-cols-12 gap-2 mb-2">
              <input
                type="date"
                className="input col-span-5 text-sm"
                value={testForm.date}
                onChange={(e) => setTestForm({ ...testForm, date: e.target.value })}
              />
              <input
                type="number"
                placeholder="Score"
                className="input col-span-3 text-sm"
                value={testForm.score}
                onChange={(e) => setTestForm({ ...testForm, score: e.target.value })}
              />
              <button className="btn-primary col-span-4 text-sm" onClick={addTest} disabled={testForm.score === ''}>
                <Plus size={14} /> Add
              </button>
              <input
                type="text"
                placeholder="Notes (optional)"
                className="input col-span-12 text-sm"
                value={testForm.notes}
                onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
              />
            </div>
            {tests.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No practice tests yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {tests.map((t) => (
                  <li key={t.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium tabular-nums">{t.score}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {fmtDateShort(t.date)} {t.notes ? `· ${t.notes}` : ''}
                      </div>
                    </div>
                    <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => removeTest(t.id)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Study sessions */}
        <div>
          <div className="font-semibold text-sm mb-2">Study sessions</div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/60">
            <div className="grid grid-cols-12 gap-2 mb-2">
              <input
                type="date"
                className="input col-span-5 text-sm"
                value={studyForm.date}
                onChange={(e) => setStudyForm({ ...studyForm, date: e.target.value })}
              />
              <input
                type="number"
                min="1"
                placeholder="Min"
                className="input col-span-3 text-sm"
                value={studyForm.duration}
                onChange={(e) => setStudyForm({ ...studyForm, duration: e.target.value })}
              />
              <button className="btn-primary col-span-4 text-sm" onClick={addStudy} disabled={!studyForm.duration}>
                <Plus size={14} /> Add
              </button>
              <select
                className="input col-span-12 text-sm"
                value={studyForm.section}
                onChange={(e) => setStudyForm({ ...studyForm, section: e.target.value })}
              >
                {ASVAB_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {studies.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No study sessions yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                {studies.map((s) => (
                  <li key={s.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{s.section}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {fmtDateShort(s.date)} · <span className="tabular-nums">{s.duration} min</span>
                      </div>
                    </div>
                    <button className="btn-ghost !p-1.5 hover:!text-rose-600" onClick={() => removeStudy(s.id)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
