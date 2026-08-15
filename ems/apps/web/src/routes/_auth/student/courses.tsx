import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { StudentShell } from '@/components/StudentShell'
import { getStudentCourses, studentCoursesQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/courses')({
  component: MyCoursesPage,
})

function MyCoursesPage() {
  const { data, isPending, error } = useQuery({
    queryKey: studentCoursesQueryKey,
    queryFn: getStudentCourses,
  })

  return (
    <StudentShell pageTitle="My Courses" guide="Courses you are approved for this semester. Open a course for materials, attendance and assignments.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <div className="mb-7">
          <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>My Courses</h1>
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {data?.semester?.label ?? 'Current semester'}
          </p>
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading courses…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load courses.')}</p>
        ) : !data?.courses.length ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            You are not registered for any courses.{' '}
            <Link to="/student/course-registration" style={{ color: 'var(--success)' }}>Register</Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.courses.map((course) => (
              <Link
                key={course.offeringId}
                to="/student/course-detail"
                search={{ id: course.offeringId }}
                className="block p-5"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center rounded-lg" style={{ width: 44, height: 44, backgroundColor: course.color }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#fff' }}>{course.code}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{course.name}</p>
                    <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{course.lecturerName ?? 'Lecturer TBC'} · {course.credits} cr</p>
                  </div>
                </div>
                <span className="t-label" style={{ color: 'var(--muted-foreground)' }}>{course.type}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudentShell>
  )
}
