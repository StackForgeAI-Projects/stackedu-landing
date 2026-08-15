import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { AcademicShell } from '@/components/AcademicShell'
import {
  academicTimetableQueryKey,
  listAcademicTimetableSlots,
} from '@/lib/api/academic'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/academic/timetable')({
  component: TimetableManagerPage,
})

const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

function fmt(h: number) { return `${String(h).padStart(2, '0')}:00` }

function TimetableManagerPage() {
  const { data, isPending, error } = useQuery({
    queryKey: academicTimetableQueryKey,
    queryFn: listAcademicTimetableSlots,
  })

  const slots = data ?? []

  const conflict = useMemo(() => slots.some((a, i) =>
    slots.some((b, j) => i !== j && a.day === b.day && a.hour === b.hour && ((a.lecturer && a.lecturer === b.lecturer) || (a.room && a.room === b.room))),
  ), [slots])

  const readOnlyMsg = () => toast.info('Timetable changes are not saved yet — schedule is read-only from the API.')

  return (
    <AcademicShell pageTitle="Timetable">
      <div className="page-body animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Timetable Manager</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              {isPending ? 'Loading…' : 'Weekly class schedule from the API'}
            </p>
          </div>
          <button type="button" onClick={readOnlyMsg} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)', border: 'none', cursor: 'not-allowed', opacity: 0.6 }}>
            Publish timetable
          </button>
        </div>

        {error ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load timetable.')}</p>
        ) : null}

        {conflict && (
          <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--error-bg)', border: '1px solid var(--error)' }}>
            <AlertCircle style={{ width: 16, height: 16, color: 'var(--error)', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: 'var(--error)' }}>Conflict detected: a lecturer or room is double-booked.</p>
          </div>
        )}

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading timetable…</p>
        ) : slots.length === 0 ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No timetable slots scheduled yet.</p>
        ) : (
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th className="t-label" style={{ padding: '12px 16px', width: 72, borderBottom: '1px solid var(--border)', textAlign: 'left' }}>Time</th>
                    {DAY_ABBR.map((d) => (
                      <th key={d} className="t-label text-center" style={{ padding: '12px 8px', borderBottom: '1px solid var(--border)' }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour) => (
                    <tr key={hour} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="t-mono" style={{ color: 'var(--muted-foreground)', padding: '8px 16px', fontSize: 11, verticalAlign: 'top' }}>{fmt(hour)}</td>
                      {[1, 2, 3, 4, 5].map((day) => {
                        const slot = slots.find((s) => s.day === day && s.hour === hour)
                        return (
                          <td key={day} style={{ padding: 4, verticalAlign: 'top' }}>
                            {slot ? (
                              <button type="button" onClick={readOnlyMsg} className="w-full text-left p-2.5 rounded-lg" style={{ backgroundColor: `${slot.color}18`, border: `1px solid ${slot.color}40`, cursor: 'pointer', minHeight: 64 }}>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: slot.color, marginBottom: 2 }}>{slot.courseCode}</p>
                                <p className="text-xs truncate" style={{ fontWeight: 500, marginBottom: 2 }}>{slot.courseName}</p>
                                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{slot.room ?? '—'}</p>
                                <span style={{ fontSize: 9, fontWeight: 600, color: slot.color, textTransform: 'uppercase' }}>{slot.type}</span>
                              </button>
                            ) : (
                              <button type="button" onClick={readOnlyMsg} className="w-full rounded-lg flex items-center justify-center" style={{ height: 64, border: '1px dashed var(--border)', color: 'var(--muted-foreground)', background: 'none', cursor: 'not-allowed', opacity: 0.4, fontSize: 20 }}>+</button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AcademicShell>
  )
}
