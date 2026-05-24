import { useMemo, useState } from 'react'
import { Plus, Trash2, BookOpen, Brain, Clock as ClockIcon } from 'lucide-react'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { ASVAB_SECTIONS } from '../../lib/defaults'
import ProgressBar from '../../components/ui/ProgressBar'
import SectionHeader from '../../components/ui/SectionHeader'
import { fmtDateShort, todayISO } from '../../lib/calc'

export default function AsvabTracker() {
  const { asvab, setAsvab } = useAppData()

  const setTarget = (target) => setAsvab({ ...asvab, target: parseInt(target || '0', 10) || 0 })

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
    <section>
      <SectionHeader
        icon={BookOpen}
        accent="violet"
        eyebrow="ASVAB"
        title="Test prep"
        sub="Practice tests, weak sections, study log."
        actions={
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target</label>
            <input
              type="number"
              min="1"
              max="99"
              className="input w-20 text-sm"
              value={asvab.target ?? 80}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-brand-600 dark:text-brand-400" />
            <div className="stat-label">Best score</div>
          </div>
          <div className="stat-value">{bestScore || '—'}</div>
          <div className="mt-3">
            <ProgressBar value={bestScore} max={asvab.target || 80} color="brand" label={`Target ${asvab.target || 80}`} />
          </div>
        </div>
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-violet-600 dark:text-violet-400" />
            <div className="stat-label">Last test</div>
          </div>
          <div className="stat-value">{last?.score ?? '—'}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{last ? fmtDateShort(last.date) : '—'}</div>
        </div>
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
            <div className="stat-label">Study time</div>
          </div>
          <div className="stat-value tabular-nums">{Math.floor(totalMinutes / 60)}<span className="text-base font-bold opacity-60">h</span> {totalMinutes % 60}<span className="text-base font-bold opacity-60">m</span></div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{studies.length} session{studies.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* Weak sections */}
      <div className="card-padded mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Weak sections</h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {(asvab.weakSections || []).length} flagged
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ASVAB_SECTIONS.map((s) => {
            const active = (asvab.weakSections || []).includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleWeak(s)}
                className={`badge cursor-pointer transition ${
                  active
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-500/30'
                    : 'bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] ring-1 ring-transparent'
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Practice tests + study sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-padded">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">Practice tests</h4>
          <div className="grid grid-cols-12 gap-2 mb-3">
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
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-white/[0.03]
                                          border border-slate-200/70 dark:border-white/[0.04] px-3 py-2 text-sm">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-extrabold text-sm tabular-nums shrink-0">
                      {t.score}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDateShort(t.date)}</div>
                      {t.notes && <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{t.notes}</div>}
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

        <div className="card-padded">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">Study sessions</h4>
          <div className="grid grid-cols-12 gap-2 mb-3">
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
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {studies.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-white/[0.03]
                                          border border-slate-200/70 dark:border-white/[0.04] px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-slate-900 dark:text-white">{s.section}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
    </section>
  )
}
