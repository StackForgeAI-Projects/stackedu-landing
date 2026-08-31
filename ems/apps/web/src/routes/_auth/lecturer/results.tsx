import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { BarChart2 } from 'lucide-react'
import type { LecturerCourseRow, LecturerResultBatch } from '@stackedu/shared'
import { LecturerShell } from '@/components/LecturerShell'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerResults,
  lecturerCoursesQueryKey,
  lecturerDashboardQueryKey,
  lecturerResultsQueryKey,
  listLecturerCourses,
  saveLecturerResults,
  submitLecturerResults,
} from '@/lib/api/lecturer'
import { calcGrade, gradeColor } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/results')({
  component: ResultEntryPage,
})

function ResultEntryPage() {
  const { data: courses = [], isPending, error } = useQuery({
    queryKey: lecturerCoursesQueryKey,
    queryFn: listLecturerCourses,
  })
  const [offeringId, setOfferingId] = useState('')

  useEffect(() => {
    if (!offeringId && courses[0]) setOfferingId(courses[0].offeringId)
  }, [courses, offeringId])

  return (
    <LecturerShell pageTitle="Results" guide="Enter final course marks and submit them for Academic Admin review. Students only see published results.">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>Results</h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Enter and submit marks for your assigned courses.</p>
          </div>
          {courses.length > 0 && (
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.offeringId} value={c.offeringId}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading courses…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load courses.')}</p>
        ) : courses.length === 0 ? (
          <EmptyResults />
        ) : offeringId ? (
          <CourseResults offeringId={offeringId} courses={courses} />
        ) : null}
      </div>
    </LecturerShell>
  )
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div style={{ width: 56, height: 56, backgroundColor: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <BarChart2 style={{ width: 24, height: 24, color: 'var(--muted-foreground)' }} />
      </div>
      <p className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>No assigned courses</p>
      <p className="t-body-sm" style={{ color: 'var(--muted-foreground)' }}>Results appear here once a course is assigned to you.</p>
    </div>
  )
}

function CourseResults({ offeringId, courses }: { offeringId: string; courses: LecturerCourseRow[] }) {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: lecturerResultsQueryKey(offeringId),
    queryFn: () => getLecturerResults(offeringId),
  })
  const course = courses.find((item) => item.offeringId === offeringId)

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading results…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load results.')}</p>
  if (!data) return null

  const locked = data.status === 'PendingReview' || data.status === 'Approved' || data.status === 'Published'

  return (
    <MarksEntryTable
      batch={data}
      courseLabel={course ? `${course.code} — ${course.name}` : data.courseCode}
      locked={locked}
      onSaved={async () => {
        await queryClient.invalidateQueries({ queryKey: lecturerResultsQueryKey(offeringId) })
        await queryClient.invalidateQueries({ queryKey: lecturerDashboardQueryKey })
      }}
    />
  )
}

function MarksEntryTable({
  batch,
  courseLabel,
  locked,
  onSaved,
}: {
  batch: LecturerResultBatch
  courseLabel: string
  locked: boolean
  onSaved: () => Promise<void>
}) {
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(batch.students.map((s) => [s.studentId, s.totalScore != null ? String(s.totalScore) : ''])),
  )

  useEffect(() => {
    setMarks(Object.fromEntries(batch.students.map((s) => [s.studentId, s.totalScore != null ? String(s.totalScore) : ''])))
  }, [batch.offeringId, batch.status, batch.students])

  const setMark = (id: string, val: string) => {
    const num = Number(val)
    if (val !== '' && (Number.isNaN(num) || num < 0 || num > 100)) return
    setMarks((prev) => ({ ...prev, [id]: val }))
  }

  const numericMarks = useMemo(
    () => batch.students.map((s) => parseFloat(marks[s.studentId] ?? '')).filter((v) => !Number.isNaN(v)),
    [marks, batch.students],
  )
  const avg = numericMarks.length ? (numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length).toFixed(1) : '—'
  const highest = numericMarks.length ? Math.max(...numericMarks).toFixed(0) : '—'
  const lowest = numericMarks.length ? Math.min(...numericMarks).toFixed(0) : '—'

  const save = useMutation({
    mutationFn: () =>
      saveLecturerResults(batch.offeringId, {
        entries: batch.students
          .filter((s) => marks[s.studentId] !== '')
          .map((s) => ({ studentId: s.studentId, totalScore: Number(marks[s.studentId]) })),
      }),
    onSuccess: async () => {
      toast.success('Draft saved')
      await onSaved()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the draft.')),
  })

  const submit = useMutation({
    mutationFn: async () => {
      const entries = batch.students.map((s) => ({
        studentId: s.studentId,
        totalScore: Number(marks[s.studentId]),
      }))
      if (entries.some((entry) => Number.isNaN(entry.totalScore))) {
        throw new Error('Enter a mark for every student before submitting.')
      }
      await saveLecturerResults(batch.offeringId, { entries })
      return submitLecturerResults(batch.offeringId)
    },
    onSuccess: async () => {
      toast.success(`${courseLabel} results submitted for review`)
      await onSaved()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not submit results.')),
  })

  const statusLabel = batch.status === 'PendingReview' ? 'Pending review' : batch.status ?? 'Draft'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="t-label px-2.5 py-1" style={{ backgroundColor: locked ? 'var(--info-bg)' : 'var(--muted)', color: locked ? 'var(--info)' : 'var(--muted-foreground)', borderRadius: 'var(--radius-sm)' }}>
          {statusLabel}
        </span>
        {batch.rejectionReason ? (
          <p className="t-body-sm" style={{ color: 'var(--error)' }}>Returned: {batch.rejectionReason}</p>
        ) : null}
      </div>

      <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
        <div className="hidden sm:grid px-5 py-3" style={{ gridTemplateColumns: '140px 1fr 160px 80px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          {['STUDENT ID', 'NAME', 'MARKS / 100', 'GRADE'].map((h) => (
            <span key={h} className="t-label" style={{ color: 'var(--muted-foreground)' }}>{h}</span>
          ))}
        </div>

        {batch.students.map((s, i) => {
          const rawMark = marks[s.studentId] ?? ''
          const numMark = parseFloat(rawMark)
          const grade = rawMark !== '' && !Number.isNaN(numMark) ? calcGrade(numMark, 100) : '—'
          const gc = gradeColor(grade)
          return (
            <div
              key={s.studentId}
              className="grid items-center px-5 gap-2"
              style={{ gridTemplateColumns: '1fr', paddingTop: 12, paddingBottom: 12, borderBottom: i < batch.students.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="sm:hidden">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{s.studentNumber}</p>
              </div>
              <div className="hidden sm:contents">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.studentNumber}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="/ 100"
                  value={rawMark}
                  disabled={locked}
                  onChange={(e) => setMark(s.studentId, e.target.value)}
                  style={{ height: 32, width: 100, fontSize: '0.875rem' }}
                />
                <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>
                  {grade}
                </span>
              </div>
            </div>
          )
        })}

        <div className="flex flex-wrap gap-3 px-5 py-3" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Avg: <strong style={{ color: 'var(--foreground)' }}>{avg}</strong></span>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>High: <strong style={{ color: 'var(--success)' }}>{highest}</strong></span>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Low: <strong style={{ color: 'var(--error)' }}>{lowest}</strong></span>
        </div>
      </div>

      {!locked && (
        <div className="flex flex-wrap items-center gap-3">
          <ConfirmAlertDialog
            trigger={
              <Button style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }} disabled={submit.isPending}>
                Submit for publishing
              </Button>
            }
            title="Submit results for publishing?"
            tone="info"
            headlineLabel="Action"
            headline="Submit for review"
            summary="Once submitted, results will be reviewed by the Academic Admin before publishing to students."
            notices={[
              { icon: 'file', label: 'Your draft will move to the admin review queue.' },
              { icon: 'user', label: 'Students cannot see these results until they are approved and published.' },
            ]}
            caution="This action cannot be undone until the batch is returned."
            confirmLabel="Submit"
            confirmVariant="brand"
            onConfirm={() => submit.mutate()}
          />
          <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate()}>Save draft</Button>
        </div>
      )}
    </div>
  )
}
