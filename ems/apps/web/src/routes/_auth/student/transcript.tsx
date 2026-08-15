import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { StudentShell } from '@/components/StudentShell'
import { getStudentTranscript, studentTranscriptQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/transcript')({
  component: TranscriptPage,
})

function TranscriptPage() {
  const { data, isPending, error } = useQuery({
    queryKey: studentTranscriptQueryKey,
    queryFn: getStudentTranscript,
  })

  return (
    <StudentShell pageTitle="Transcript" guide="An unofficial transcript from published results. The official copy is issued by Academic Admin.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/results" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Results</Link>
        <h1 className="t-h1 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Unofficial transcript</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading transcript…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load transcript.')}</p>
        ) : data ? (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p className="text-sm font-semibold">{data.profile.fullName}</p>
            <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {data.profile.studentNumber} · {data.profile.programmeName} · CGPA {data.cgpa?.toFixed(2) ?? '—'}
            </p>
            {data.semesters.map((semester) => (
              <div key={semester.semesterId} className="mb-4">
                <p className="t-label mb-2">{semester.label}</p>
                {semester.courses.map((course) => (
                  <div key={course.offeringId} className="flex gap-3 py-2 text-sm" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="t-mono w-16">{course.courseCode}</span>
                    <span className="flex-1">{course.courseName}</span>
                    <span>{course.grade ?? '—'}</span>
                  </div>
                ))}
              </div>
            ))}
            {!data.semesters.length ? (
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published results to show.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </StudentShell>
  )
}
