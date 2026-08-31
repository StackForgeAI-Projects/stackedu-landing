import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Users, ChevronRight, Search } from 'lucide-react'
import type { LecturerCourseDetail, LecturerCourseRow } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { CourseCodePill } from '@/components/CourseCodePill'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerCourse,
  lecturerCourseQueryKey,
  lecturerCoursesQueryKey,
  listLecturerCourses,
} from '@/lib/api/lecturer'
import { gradeColor } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/courses')({
  component: MyCoursesPage,
})

function MyCoursesPage() {
  const { data: courses = [], isPending, error } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [selectedId, setSelectedId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId && courses[0]) setSelectedId(courses[0].offeringId)
  }, [courses, selectedId])

  const selected = courses.find((c) => c.offeringId === selectedId) ?? null
  const { data: detail } = useQuery({
    queryKey: lecturerCourseQueryKey(selectedId),
    queryFn: () => getLecturerCourse(selectedId),
    enabled: Boolean(selectedId),
  })
  const activeStudent = detail?.students.find((s) => s.studentId === activeStudentId) ?? null

  return (
    <LecturerShell pageTitle="My Courses" guide="Courses assigned to you this semester, with the enrolled roster, materials and assessments.">
      {isPending ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>Loading courses…</p>
      ) : error ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load courses.')}</p>
      ) : courses.length === 0 ? (
        <p className="t-body px-4 sm:px-8 py-8" style={{ color: 'var(--muted-foreground)' }}>No courses assigned this semester.</p>
      ) : (
        <div className="page-master animate-fade-up">
          <div className="page-master-list">
            <h2 className="t-h3 mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', paddingLeft: 4 }}>My Courses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courses.map((course) => (
                <CourseListCard
                  key={course.offeringId}
                  course={course}
                  active={selectedId === course.offeringId}
                  onClick={() => { setSelectedId(course.offeringId); setActiveStudentId(null); setStudentSearch('') }}
                />
              ))}
            </div>
          </div>
          <div className="page-master-detail">
            {selected && <CourseDetail course={selected} detail={detail} studentSearch={studentSearch} onStudentSearchChange={setStudentSearch} onStudentClick={setActiveStudentId} />}
          </div>
        </div>
      )}

      <Sheet open={activeStudent !== null} onOpenChange={(open) => { if (!open) setActiveStudentId(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {activeStudent && selected && (
            <StudentSheet student={activeStudent} course={selected} onClose={() => setActiveStudentId(null)} />
          )}
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function CourseListCard({ course, active, onClick }: { course: LecturerCourseRow; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: active ? 'rgba(15, 189, 59,0.06)' : hovered ? 'var(--muted)' : 'var(--card)',
        border: active ? '1px solid rgba(15, 189, 59,0.2)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '14px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: hovered && !active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow 150ms ease-out',
      }}
    >
      <CourseCodePill code={course.code} color={course.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: active ? 'var(--brand)' : 'var(--foreground)' }}>{course.name}</p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{course.enrolledCount} students · {course.credits} credits</p>
        <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Next: {course.nextClassShort}</p>
      </div>
      <ChevronRight style={{ width: 15, height: 15, color: active ? 'var(--brand)' : 'var(--muted-foreground)', flexShrink: 0 }} />
    </div>
  )
}

function CourseDetail({
  course,
  detail,
  studentSearch,
  onStudentSearchChange,
  onStudentClick,
}: {
  course: LecturerCourseRow
  detail: LecturerCourseDetail | undefined
  studentSearch: string
  onStudentSearchChange: (q: string) => void
  onStudentClick: (id: string) => void
}) {
  const students = detail?.students ?? []
  const filtered = students.filter((s) =>
    !studentSearch
    || s.name.toLowerCase().includes(studentSearch.toLowerCase())
    || s.studentNumber.toLowerCase().includes(studentSearch.toLowerCase()),
  )
  const avg = students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) / students.length)
    : 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CourseCodePill code={course.code} color={course.color} size="md" />
          <div>
            <h1 className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{course.name}</h1>
            <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>{course.semesterName} · {course.credits} credits</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {course.schedule.map((slot, i) => (
            <span key={i} className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
              {slot.day} · {slot.time} · {slot.room}
            </span>
          ))}
          <span className="flex items-center gap-1 t-caption" style={{ color: 'var(--muted-foreground)' }}>
            <Users style={{ width: 12, height: 12 }} /> {course.enrolledCount} students
          </span>
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-5">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="mb-4 flex items-center gap-2" style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', height: 38 }}>
            <Search style={{ width: 14, height: 14, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input type="text" placeholder="Search students…" value={studentSearch} onChange={(e) => onStudentSearchChange(e.target.value)} className="flex-1 bg-transparent outline-none" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }} />
          </div>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <p className="t-body-sm px-5 py-8" style={{ color: 'var(--muted-foreground)' }}>No enrolled students yet.</p>
            ) : filtered.map((s, i) => {
              const gc = gradeColor(s.lastGrade ?? '—')
              return (
                <button
                  key={s.studentId}
                  type="button"
                  className="w-full text-left flex flex-col sm:grid sm:items-center px-5 gap-1"
                  style={{ gridTemplateColumns: '140px 1fr 110px 70px 80px', paddingTop: 13, paddingBottom: 13, borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: 'transparent', cursor: 'pointer' }}
                  onClick={() => onStudentClick(s.studentId)}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                  <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.attendanceRate != null ? `${s.attendanceRate}%` : '—'}</span>
                  <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{s.lastGrade ?? '—'}</span>
                  <span className="t-caption" style={{ color: 'var(--success)' }}>View →</span>
                </button>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(detail?.materials ?? []).length === 0 && (detail?.assessments ?? []).length === 0 ? (
              <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>No materials or assessments published yet.</p>
            ) : null}
            {(detail?.materials ?? []).map((m) => (
              <div key={m.id} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '14px 16px' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{m.title}</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{m.moduleName ?? 'Material'}{m.description ? ` · ${m.description}` : ''}</p>
              </div>
            ))}
            {(detail?.assessments ?? []).map((a) => (
              <div key={a.id} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '14px 16px' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{a.title}</p>
                <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{a.type} · {a.weight}% · {a.totalMarks} marks</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
              <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>AVERAGE ATTENDANCE</p>
              <p className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{avg}%</p>
            </div>
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
              <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>ENROLLED</p>
              <p className="t-h2" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{students.length}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StudentSheet({
  student,
  course,
  onClose,
}: {
  student: LecturerCourseDetail['students'][number]
  course: LecturerCourseRow
  onClose: () => void
}) {
  const gc = gradeColor(student.lastGrade ?? '—')
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{course.code}</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>{student.name}</h3>
        <p className="t-caption mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>{student.studentNumber}</p>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Attendance: {student.attendanceRate != null ? `${student.attendanceRate}%` : '—'}</p>
        <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>
          Course grade: <span className="t-label px-2 py-0.5" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>{student.lastGrade ?? '—'}</span>
        </p>
        {student.riskLevel ? (
          <p className="t-body-sm" style={{ color: 'var(--error)' }}>Risk: {student.riskLevel}</p>
        ) : null}
      </div>
      <div style={{ padding: '0 24px 28px' }}>
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}
