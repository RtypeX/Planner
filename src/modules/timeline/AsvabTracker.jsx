import { useMemo, useState } from 'react'
import { Plus, Trash2, BookOpen, Brain, Clock as ClockIcon, Award, Info } from 'lucide-react'
import { useAppData } from '../../lib/AppData'
import { uid } from '../../lib/storage'
import { ASVAB_SECTIONS } from '../../lib/defaults'
import ProgressBar from '../../components/ui/ProgressBar'
import SectionHeader from '../../components/ui/SectionHeader'
import { fmtDateShort, todayISO } from '../../lib/calc'

/** Air Force composite score reference. Each AFSC is the *minimum* line score needed. */
const AFSC_REFS = [
  { code: 'M', label: 'Mechanical',      desc: 'Engines, vehicles, aerospace ground equipment' },
  { code: 'A', label: 'Administrative',  desc: 'Personnel, finance, HR' },
  { code: 'G', label: 'General',         desc: 'Intel, security forces, ops' },
  { code: 'E', label: 'Electronics',     desc: 'Avionics, cyber, radar, comms' },
]

const COMMON_AFSCS = [
  { afsc: '1B4',   name: 'Cyber warfare',        line: { E: 64 } },
  { afsc: '1A8',   name: 'Airborne cryptolinguist', line: { G: 72 } },
  { afsc: '1N0',   name: 'Operations intel',     line: { G: 64 } },
  { afsc: '3F0',   name: 'Personnel',            line: { A: 41 } },
  { afsc: '3E2',   name: 'Pavement & construction', line: { M: 40 } },
  { afsc: '2A6',   name: 'Aerospace propulsion', line: { M: 47 } },
  { afsc: '4N0',   name: 'Aerospace medical',    line: { G: 44 } },
  { afsc: '1D7',   name: 'Cyber defense ops',    line: { E: 60 } },
]

export default function AsvabTracker() {
  const { asvab, setAsvab } = useAppData()

  const setTarget = (target) => setAsvab({ ...asvab, target: parseInt(target || '0', 10) || 0 })

  const [testForm, setTestForm] = useState({
    date: todayISO(), score: '', notes: '',
    g: '', m: '', a: '', e: '',
  })
  const addTest = () => {
    if (testForm.score === '') return
    setAsvab({
      ...asvab,
      practiceTests: [
        ...(asvab.practiceTests || []),
        {
          id: uid(),
          date: testForm.date,
          score: parseInt(testForm.score, 10),
          notes: testForm.notes,
          lines: {
            G: testForm.g === '' ? null : parseInt(testForm.g, 10),
            M: testForm.m === '' ? null : parseInt(testForm.m, 10),
            A: testForm.a === '' ? null : parseInt(testForm.a, 10),
            E: testForm.e === '' ? null : parseInt(testForm.e, 10),
          },
        },
      ],
    })
    setTestForm({ date: todayISO(), score: '', notes: '', g: '', m: '', a: '', e: '' })
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

  // Best line scores across all tests
  const bestLines = useMemo(() => {
    const out = { G: 0, M: 0, A: 0, E: 0 }
    tests.forEach((t) => {
      const ln = t.lines || {}
      ;['G', 'M', 'A', 'E'].forEach((k) => {
        if (ln[k] != null && ln[k] > out[k]) out[k] = ln[k]
      })
    })
    return out
  }, [tests])

  return (
    <section>
      <SectionHeader
        icon={BookOpen}
        accent="violet"
        eyebrow="ASVAB"
        title="Test prep"
        sub="Practice tests, line scores, study log."
        actions={
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">AFQT target</label>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 stagger">
        <div className="card-padded">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-brand-600 dark:text-brand-400" />
            <div className="stat-label">Best AFQT</div>
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
          <div className="stat-value tabular-nums">
            {Math.floor(totalMinutes / 60)}<span className="text-base font-bold opacity-60">h</span>{' '}
            {totalMinutes % 60}<span className="text-base font-bold opacity-60">m</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{studies.length} session{studies.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* MAGE line scores */}
      <div className="card-padded mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Award size={15} className="text-amber-500" />
            Line scores (best of)
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
            <Info size={11} /> Air Force uses MAGE for AFSC qualification
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {AFSC_REFS.map((c) => (
            <LineScoreTile key={c.code} code={c.code} label={c.label} value={bestLines[c.code] || 0} />
          ))}
        </div>
        {(bestLines.G || bestLines.M || bestLines.A || bestLines.E) > 0 && (
          <details className="mt-4">
            <summary className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
              AFSCs you'd qualify for
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_AFSCS.map((a) => {
                const need = a.line
                const qualifies = Object.entries(need).every(([k, v]) => (bestLines[k] || 0) >= v)
                const reqText = Object.entries(need).map(([k, v]) => `${k} ≥ ${v}`).join(', ')
                return (
                  <div
                    key={a.afsc}
                    className={`rounded-lg p-2.5 border flex items-center gap-2 text-xs
                      ${qualifies
                        ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
                        : 'border-slate-200 dark:border-white/[0.06] opacity-60'}`}
                  >
                    <span className="font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200">{a.afsc}</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate flex-1">{a.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">{reqText}</span>
                    {qualifies && <span className="text-emerald-600 dark:text-emerald-400 shrink-0">✓</span>}
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Reference only — actual AFSC qualification depends on health, security clearance, and current Air Force needs.
            </p>
          </details>
        )}
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
              placeholder="AFQT"
              className="input col-span-3 text-sm"
              value={testForm.score}
              onChange={(e) => setTestForm({ ...testForm, score: e.target.value })}
            />
            <button className="btn-primary col-span-4 text-sm" onClick={addTest} disabled={testForm.score === ''}>
              <Plus size={14} /> Add
            </button>
            {/* MAGE inputs */}
            <input type="number" placeholder="M" className="input col-span-3 text-sm text-center font-mono"
                   value={testForm.m} onChange={(e) => setTestForm({ ...testForm, m: e.target.value })} />
            <input type="number" placeholder="A" className="input col-span-3 text-sm text-center font-mono"
                   value={testForm.a} onChange={(e) => setTestForm({ ...testForm, a: e.target.value })} />
            <input type="number" placeholder="G" className="input col-span-3 text-sm text-center font-mono"
                   value={testForm.g} onChange={(e) => setTestForm({ ...testForm, g: e.target.value })} />
            <input type="number" placeholder="E" className="input col-span-3 text-sm text-center font-mono"
                   value={testForm.e} onChange={(e) => setTestForm({ ...testForm, e: e.target.value })} />
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
                      {t.lines && (t.lines.G || t.lines.M || t.lines.A || t.lines.E) ? (
                        <div className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-0.5">
                          {['M','A','G','E'].filter((k) => t.lines?.[k] != null).map((k) => `${k}${t.lines[k]}`).join(' · ')}
                        </div>
                      ) : null}
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

function LineScoreTile({ code, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.05] p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono font-extrabold text-lg text-violet-600 dark:text-violet-300">
          {code}
        </span>
        <span className="text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
          {value || '—'}
        </span>
      </div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
        {label}
      </div>
    </div>
  )
}
