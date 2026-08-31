import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ClipboardList, CheckCircle2, Eye } from 'lucide-react'
import type { AttendanceStatus, LecturerAttendanceSession } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerAttendanceSession,
  getLecturerCourse,
  lecturerAttendanceQueryKey,
  lecturerAttendanceSessionQueryKey,
  lecturerCourseQueryKey,
  lecturerCoursesQueryKey,
  lecturerDashboardQueryKey,
  listLecturerAttendance,
  listLecturerCourses,
  saveLecturerAttendance,
} from '@/lib/api/lecturer'
import { formatDateLong, formatDateShort } from '@/lib/utils'

export const Route = createFileRoute('/_auth/lecturer/attendance')({
  component: AttendancePage,
})

type AttStatus = Extract<AttendanceStatus, 'Present' | 'Absent' | 'Late'>

function AttendancePage() {
  const queryClient = useQueryClient()
  const { data: courses = [] } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [offeringId, setOfferingId] = useState('')
  const [sessionActive, setSessionActive] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, AttStatus>>({})
  const [viewSessionId, setViewSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (!offeringId && courses[0]) setOfferingId(courses[0].offeringId)
  }, [courses, offeringId])

  const { data: course } = useQuery({
    queryKey: lecturerCourseQueryKey(offeringId),
    queryFn: () => getLecturerCourse(offeringId),
    enabled: Boolean(offeringId),
  })
  const { data: sessions = [], isPending, error } = useQuery({
    queryKey: lecturerAttendanceQueryKey(offeringId),
    queryFn: () => listLecturerAttendance(offeringId),
    enabled: Boolean(offeringId),
  })

  const students = course?.students ?? []
  const today = new Date().toISOString().slice(0, 10)
  const nextSessionNum = sessions.length + 1
  const getStatus = (id: string): AttStatus => statuses[id] ?? 'Present'
  const counts = students.reduce(
    (acc, s) => {
      const st = getStatus(s.studentId)
      if (st === 'Present') acc.present += 1
      else if (st === 'Absent') acc.absent += 1
      else acc.late += 1
      return acc
    },
    { present: 0, absent: 0, late: 0 },
  )

  const startSession = () => {
    const initial: Record<string, AttStatus> = {}
    students.forEach((s) => { initial[s.studentId] = 'Present' })
    setStatuses(initial)
    setSessionActive(true)
  }

  const save = useMutation({
    mutationFn: (close: boolean) =>
      saveLecturerAttendance({
        offeringId,
        sessionDate: today,
        topic: `Session ${nextSessionNum}`,
        close,
        records: students.map((s) => ({ studentId: s.studentId, status: getStatus(s.studentId) })),
      }),
    onSuccess: async (_data, close) => {
      toast.success(close ? `Attendance recorded for ${course?.code ?? 'this course'}` : 'Draft saved')
      if (close) {
        setSessionActive(false)
        setStatuses({})
      }
      await queryClient.invalidateQueries({ queryKey: lecturerAttendanceQueryKey(offeringId) })
      await queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save attendance.')),
  })

  return (
    <LecturerShell pageTitle="Attendance" guide="Start a session, mark each enrolled student Present, Absent or Late, then submit. History is stored per course.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Attendance</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Record and track student attendance per session.</p>
          </div>
          {courses.length > 0 && (
            <Select value={offeringId} onValueChange={(id) => { setOfferingId(id); setSessionActive(false); setStatuses({}) }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {error ? (
          <p className="t-body mb-6" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load attendance.')}</p>
        ) : null}

        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: '20px 24px' }}
        >
          <div>
            <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>CURRENT SESSION</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{course ? `${course.code} — ${course.name}` : 'Select a course'}</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Session {nextSessionNum} · {formatDateLong(today)}</p>
          </div>
          {!sessionActive && (
            <Button onClick={startSession} disabled={!course || students.length === 0} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
              Start session
            </Button>
          )}
          {sessionActive && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present: {counts.present}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Absent: {counts.absent}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>Late: {counts.late}</span>
            </div>
          )}
        </div>

        {sessionActive && (
          <div className="mb-6">
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="hidden sm:grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 220px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>STUDENT ID</span>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>NAME</span>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>STATUS</span>
              </div>
              {students.map((s, i) => {
                const status = getStatus(s.studentId)
                return (
                  <div key={s.studentId} className="flex flex-col sm:grid sm:items-center px-5 gap-2" style={{ gridTemplateColumns: '140px 1fr 220px', paddingTop: 13, paddingBottom: 13, borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {(['Present', 'Absent', 'Late'] as AttStatus[]).map((opt) => {
                        const active = status === opt
                        const colors = { Present: 'var(--success)', Absent: 'var(--error)', Late: 'var(--warning)' }
                        const bgs = { Present: 'var(--success-bg)', Absent: 'var(--error-bg)', Late: 'var(--warning-bg)' }
                        return (
                          <button
                            key={opt}
                            onClick={() => setStatuses((prev) => ({ ...prev, [s.studentId]: opt }))}
                            className="px-2.5 py-1 text-xs font-semibold"
                            style={{
                              borderRadius: 'var(--radius-sm)',
                              border: active ? `1.5px solid ${colors[opt]}` : '1.5px solid var(--border)',
                              backgroundColor: active ? bgs[opt] : 'transparent',
                              color: active ? colors[opt] : 'var(--muted-foreground)',
                              cursor: 'pointer',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button onClick={() => save.mutate(true)} disabled={save.isPending} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>
                <CheckCircle2 style={{ width: 15, height: 15, marginRight: 6 }} />
                Submit attendance
              </Button>
              <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate(false)}>Save draft</Button>
            </div>
          </div>
        )}

        {!sessionActive && (
          <div className="flex flex-col items-center justify-center py-12 text-center mb-6">
            <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <ClipboardList style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
            </div>
            <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No active session</p>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
              Click Start session to begin recording attendance for today.
            </p>
          </div>
        )}

        <div>
          <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Attendance History</h2>
          <HistoryTable sessions={sessions} loading={isPending} onView={setViewSessionId} />
        </div>
      </div>

      <Sheet open={viewSessionId !== null} onOpenChange={(open) => { if (!open) setViewSessionId(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {viewSessionId && <SessionDetailSheet sessionId={viewSessionId} onClose={() => setViewSessionId(null)} />}
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function HistoryTable({
  sessions,
  loading,
  onView,
}: {
  sessions: LecturerAttendanceSession[]
  loading: boolean
  onView: (id: string) => void
}) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div className="hidden sm:grid px-5 py-3" style={{ gridTemplateColumns: '100px 1fr 100px 80px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
        {['DATE', 'TOPIC', 'PRESENT', 'RATE', ''].map((h) => <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>)}
      </div>
      {loading ? (
        <div className="py-10 text-center"><p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Loading sessions…</p></div>
      ) : sessions.length === 0 ? (
        <div className="py-10 text-center"><p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No sessions recorded yet.</p></div>
      ) : sessions.map((s, i) => {
        const pct = s.total ? Math.round(((s.present + s.late) / s.total) * 100) : 0
        return (
          <div key={s.id} className="flex flex-col sm:grid sm:items-center px-5 gap-1" style={{ gridTemplateColumns: '100px 1fr 100px 80px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{formatDateShort(s.sessionDate)}</span>
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.topic ?? 'Class session'}</span>
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>{s.present + s.late} / {s.total}</span>
            <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: pct >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)', color: pct >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>{pct}%</span>
            <button className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onView(s.id)}>
              <Eye style={{ width: 12, height: 12 }} /> View
            </button>
          </div>
        )
      })}
    </div>
  )
}

function SessionDetailSheet({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { data, isPending, error } = useQuery({
    queryKey: lecturerAttendanceSessionQueryKey(sessionId),
    queryFn: () => getLecturerAttendanceSession(sessionId),
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>ATTENDANCE SESSION</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>{data?.topic ?? 'Session'}</h3>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {data ? `${data.courseCode} · Session ${data.sessionNumber} · ${formatDateShort(data.sessionDate)}` : '…'}
        </p>
      </div>
      <div style={{ padding: '20px 24px', flex: 1 }}>
        {isPending ? <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body-sm" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load this session.')}</p> : null}
        {data ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)' }}>Present: {data.present}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)' }}>Late: {data.late}</span>
              <span className="t-label px-2.5 py-1" style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}>Absent: {data.absent}</span>
            </div>
            <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {data.records.map((s, i) => (
                <div key={s.studentId} className="flex items-center gap-4 px-4" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < data.records.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)', width: 120, flexShrink: 0 }}>{s.studentNumber}</span>
                  <span className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                  <span className="t-label px-2 py-0.5" style={{ backgroundColor: s.status === 'Present' ? 'var(--success-bg)' : s.status === 'Late' ? 'var(--warning-bg)' : 'var(--error-bg)', color: s.status === 'Present' ? 'var(--success)' : s.status === 'Late' ? 'var(--warning)' : 'var(--error)', borderRadius: 'var(--radius-sm)' }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div style={{ padding: '0 24px 28px', flexShrink: 0 }}>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
