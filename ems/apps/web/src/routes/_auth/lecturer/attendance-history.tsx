import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Eye } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerAttendanceSession,
  lecturerAttendanceQueryKey,
  lecturerAttendanceSessionQueryKey,
  lecturerCoursesQueryKey,
  listLecturerAttendance,
  listLecturerCourses,
} from '@/lib/api/lecturer'
import { formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/attendance-history')({
  component: AttendanceHistoryPage,
})

function AttendanceHistoryPage() {
  const { data: courses = [] } = useQuery({ queryKey: lecturerCoursesQueryKey, queryFn: listLecturerCourses })
  const [courseId, setCourseId] = useState('all')
  const [viewId, setViewId] = useState<string | null>(null)
  const offeringId = courseId === 'all' ? undefined : courseId
  const { data: sessions = [], isPending, error } = useQuery({
    queryKey: lecturerAttendanceQueryKey(offeringId),
    queryFn: () => listLecturerAttendance(offeringId),
  })

  return (
    <LecturerShell pageTitle="Attendance History">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Attendance History</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Session-by-session records across your courses.</p>
          </div>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load history.')}</p> : null}

        <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {sessions.length === 0 && !isPending ? (
            <p className="t-body-sm px-5 py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>No sessions recorded yet.</p>
          ) : sessions.map((s, i) => {
            const pct = s.total ? Math.round(((s.present + s.late) / s.total) * 100) : 0
            return (
              <div key={s.id} className="flex flex-col sm:grid sm:items-center px-5 gap-1" style={{ gridTemplateColumns: '110px 90px 1fr 100px 70px 70px', paddingTop: 13, paddingBottom: 13, borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{formatDateShort(s.sessionDate)}</span>
                <span className="t-label" style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>{s.courseCode}</span>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.topic ?? 'Class session'}</span>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.present + s.late} / {s.total}</span>
                <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', color: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>{pct}%</span>
                <Button variant="ghost" size="sm" className="gap-1" style={{ color: 'var(--success)' }} onClick={() => setViewId(s.id)}>
                  <Eye style={{ width: 12, height: 12 }} /> View
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <Sheet open={viewId !== null} onOpenChange={(open) => { if (!open) setViewId(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {viewId ? <HistoryDetail sessionId={viewId} onClose={() => setViewId(null)} /> : null}
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function HistoryDetail({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { data, isPending } = useQuery({
    queryKey: lecturerAttendanceSessionQueryKey(sessionId),
    queryFn: () => getLecturerAttendanceSession(sessionId),
  })
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>{data?.topic ?? 'Session'}</h3>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{data ? `${data.courseCode} · ${formatDateShort(data.sessionDate)}` : '…'}</p>
      </div>
      <div style={{ padding: 24, flex: 1 }}>
        {isPending ? <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {data?.records.map((s) => (
          <div key={s.studentId} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{s.name}</span>
            <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{s.status}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 24px 28px' }}>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
