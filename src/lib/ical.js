// Minimal RFC 5545 iCalendar generator for milestones.
// Each milestone becomes an all-day VEVENT, Outlook + Google + Apple compatible.

function pad(n) { return String(n).padStart(2, '0') }

/** YYYY-MM-DD → YYYYMMDD (iCal DATE form) */
function toIcalDate(iso) {
  if (!iso || iso.length < 10) return ''
  return iso.slice(0, 10).replace(/-/g, '')
}

/** Add 1 day to a YYYYMMDD string (DTEND is exclusive for all-day events). */
function plusDay(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
}

/** Escape backslashes, commas, semicolons, and newlines per RFC 5545. */
function escape(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function nowStamp() {
  const d = new Date()
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** Long iCal lines must be folded to 75 octets per RFC 5545. */
function fold(line) {
  if (line.length <= 73) return line
  const chunks = []
  let i = 0
  while (i < line.length) {
    chunks.push((i === 0 ? '' : ' ') + line.slice(i, i + 73))
    i += 73
  }
  return chunks.join('\r\n')
}

export function buildIcs(milestones, calendarName = "Dylan's HQ — Milestones") {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dylan HQ//Milestones//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(calendarName)}`,
  ]

  const stamp = nowStamp()
  for (const m of milestones || []) {
    const dt = toIcalDate(m.date)
    if (!dt) continue
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${m.id || dt}-${Math.random().toString(36).slice(2, 8)}@dylans-hq`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART;VALUE=DATE:${dt}`)
    lines.push(`DTEND;VALUE=DATE:${plusDay(dt)}`)
    lines.push(fold(`SUMMARY:${escape(m.title || 'Milestone')}`))
    if (m.notes) lines.push(fold(`DESCRIPTION:${escape(m.notes)}`))
    if (m.category) lines.push(`CATEGORIES:${escape(m.category)}`)
    lines.push(`STATUS:${m.status === 'Done' ? 'CONFIRMED' : 'TENTATIVE'}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(milestones, filename = 'dylans-hq-milestones.ics') {
  const ics = buildIcs(milestones)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
