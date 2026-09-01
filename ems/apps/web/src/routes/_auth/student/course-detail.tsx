import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Download, ExternalLink } from 'lucide-react'
import { materialSourceLabel } from '@stackedu/shared'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { getStudentCourse, getStudentMaterialDownloadUrl, studentCourseQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/student/course-detail')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: CourseDetailPage,
})

function CourseDetailPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: studentCourseQueryKey(id),
    queryFn: () => getStudentCourse(id),
    enabled: Boolean(id),
  })

  return (
    <StudentShell pageTitle="Course" guide="Attendance, published materials and assignments for this offering. Submit written work from the assignment link.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/courses" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← My courses</Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose a course from My Courses.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading course…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load this course.')}</p>
        ) : data ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 52, height: 52, backgroundColor: data.color }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#fff' }}>{data.code}</span>
              </div>
              <div>
                <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{data.name}</h1>
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                  {data.lecturerName ?? 'Lecturer TBC'} · {data.credits} credits · {data.semesterName}
                </p>
              </div>
            </div>
            {data.description ? <p className="t-body mb-6" style={{ color: 'var(--foreground)' }}>{data.description}</p> : null}

            <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Attendance</h2>
              <p className="t-body mb-3" style={{ color: 'var(--muted-foreground)' }}>
                {data.attendanceRate === null ? 'No sessions recorded yet.' : `${data.attendanceRate}% of recorded sessions`}
              </p>
              {data.attendance.map((row) => (
                <div key={row.id} className="flex justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-sm">{row.date} · {row.topic ?? 'Class'}</span>
                  <span className="t-label">{row.status}</span>
                </div>
              ))}
            </section>

            <section className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>Materials</h2>
              {data.materials.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published materials yet.</p>
              ) : data.materials.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {item.moduleName ?? 'General'}
                      {item.description ? ` · ${item.description}` : ''}
                    </p>
                    <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {materialSourceLabel({ fileKey: item.hasFile ? item.fileName : null, externalUrl: item.externalUrl ?? null })}
                      {item.fileName ? ` · ${item.fileName}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {item.hasFile ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={async () => {
                          try {
                            const target = await getStudentMaterialDownloadUrl(item.id)
                            window.open(target.url, '_blank', 'noopener,noreferrer')
                          } catch (err) {
                            toast.error(apiErrorMessage(err, 'Could not open that file.'))
                          }
                        }}
                      >
                        <Download style={{ width: 13, height: 13 }} /> Download
                      </Button>
                    ) : null}
                    {item.externalUrl ? (
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink style={{ width: 13, height: 13 }} /> Open link
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </section>

            <section className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <div className="flex justify-between mb-3">
                <h2 className="t-h3" style={{ fontFamily: 'var(--font-display)' }}>Assignments</h2>
                <Link to="/student/assignment-submit" search={{ id: '' }} className="text-sm" style={{ color: 'var(--success)' }}>All →</Link>
              </div>
              {data.assessments.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No published assignments.</p>
              ) : data.assessments.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{item.type}{item.dueAt ? ` · due ${item.dueAt.slice(0, 10)}` : ''}</p>
                  </div>
                  {item.acceptsSubmissions ? (
                    <Link to="/student/assignment-submit" search={{ id: item.id }} className="t-caption flex-shrink-0" style={{ color: 'var(--success)' }}>
                      Submit
                    </Link>
                  ) : null}
                </div>
              ))}
            </section>
          </>
        ) : null}
      </div>
    </StudentShell>
  )
}
