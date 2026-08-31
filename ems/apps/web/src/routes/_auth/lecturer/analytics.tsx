import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BarChart2, ClipboardList, AlertTriangle } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { StatTile } from '@/components/StatTile'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerCourse,
  getLecturerResults,
  lecturerAtRiskQueryKey,
  lecturerCourseQueryKey,
  lecturerCoursesQueryKey,
  lecturerResultsQueryKey,
  listLecturerAtRiskStudents,
  listLecturerCourses,
} from '@/lib/api/lecturer'

export const Route = createFileRoute('/_auth/lecturer/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data: courses = [], isPending, error } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const { data: atRisk = [] } = useQuery({
    queryKey: lecturerAtRiskQueryKey,
    queryFn: listLecturerAtRiskStudents,
  })
  const [offeringId, setOfferingId] = useState('')
  useEffect(() => {
    if (!offeringId && courses[0]) setOfferingId(courses[0].offeringId)
  }, [courses, offeringId])

  const { data: course } = useQuery({
    queryKey: lecturerCourseQueryKey(offeringId),
    queryFn: () => getLecturerCourse(offeringId),
    enabled: Boolean(offeringId),
  })
  const { data: results } = useQuery({
    queryKey: lecturerResultsQueryKey(offeringId),
    queryFn: () => getLecturerResults(offeringId),
    enabled: Boolean(offeringId),
  })

  const avgAttendance = course?.students.length
    ? Math.round(course.students.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) / course.students.length)
    : 0
  const openAlerts = atRisk.filter((s) => !s.resolved && (offeringId === 'all' || !offeringId || s.offeringId === offeringId)).length

  return (
    <LecturerShell pageTitle="Analytics" guide="Attendance, results and at-risk counts for the courses assigned to you.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Analytics</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Live figures from your assigned courses.</p>
          </div>
          {courses.length > 0 && (
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger className="w-full sm:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {isPending ? <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p> : null}
        {error ? <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load analytics.')}</p> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatTile icon={ClipboardList} iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)" label="ATTENDANCE" value={`${avgAttendance}%`} delta="Class average" deltaColor="var(--muted-foreground)" animationDelay={0} />
          <StatTile icon={BarChart2} iconColor="var(--info)" iconBg="var(--info-bg)" label="PASS RATE" value={results?.passRate != null ? `${results.passRate}%` : '—'} delta="From submitted results" deltaColor="var(--muted-foreground)" animationDelay={60} />
          <StatTile icon={AlertTriangle} iconColor="var(--error)" iconBg="var(--error-bg)" label="AT-RISK" value={String(openAlerts)} delta="Open alerts" deltaColor="var(--error)" animationDelay={120} />
        </div>

        {results ? (
          <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24 }}>
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>Results snapshot</h2>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
              Average {results.avg ?? '—'} · High {results.highest ?? '—'} · Low {results.lowest ?? '—'} · Status {results.status ?? 'No batch yet'}
            </p>
          </div>
        ) : null}
      </div>
    </LecturerShell>
  )
}
