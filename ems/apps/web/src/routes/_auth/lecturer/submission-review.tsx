import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/client'
import {
  getLecturerAssessment,
  lecturerAssessmentQueryKey,
  saveLecturerGrade,
} from '@/lib/api/lecturer'
import { calcGrade, gradeColor } from '@/data/lecturer'
import { formatDateTime } from '@/lib/utils'
import type { LecturerAssessmentDetail } from '@stackedu/shared'

export const Route = createFileRoute('/_auth/lecturer/submission-review')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: SubmissionReviewPage,
})

function SubmissionReviewPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: lecturerAssessmentQueryKey(id),
    queryFn: () => getLecturerAssessment(id),
    enabled: Boolean(id),
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = data?.submissions.find((s) => s.studentId === activeId) ?? null

  return (
    <LecturerShell pageTitle="Submissions">
      <div className="animate-fade-up px-4 sm:px-8 py-8 pb-14" style={{ maxWidth: 920, margin: '0 auto' }}>
        <Link to="/lecturer/assignments" className="inline-flex items-center gap-1 text-sm font-medium mb-5" style={{ color: 'var(--success)' }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to assignments
        </Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose an assignment to review submissions.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load submissions.')}</p>
        ) : data ? (
          <>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>{data.title}</h1>
            <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>{data.courseCode} · {data.submittedCount}/{data.totalCount} submitted · Max {data.totalMarks}</p>
            <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              {data.submissions.map((s, i) => {
                const gc = gradeColor(s.score != null ? calcGrade(s.score, data.totalMarks) : '—')
                return (
                  <button
                    key={s.studentId}
                    type="button"
                    className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 px-5"
                    style={{ paddingTop: 14, paddingBottom: 14, borderBottom: i < data.submissions.length - 1 ? '1px solid var(--border)' : 'none', background: 'transparent', cursor: 'pointer' }}
                    onClick={() => setActiveId(s.studentId)}
                  >
                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--foreground)' }}>{s.studentName}</span>
                    <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>{s.submittedAt ? formatDateTime(s.submittedAt) : 'Not submitted'}</span>
                    <span className="t-label px-2 py-0.5 w-fit" style={{ backgroundColor: gc.bg, color: gc.color, borderRadius: 'var(--radius-sm)' }}>
                      {s.score != null ? calcGrade(s.score, data.totalMarks) : s.status}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        ) : null}
      </div>

      <Sheet open={active !== null} onOpenChange={(open) => { if (!open) setActiveId(null) }}>
        <SheetContent side="right" className="p-0 border-l overflow-hidden flex flex-col sheet-md">
          {active && data ? <GradeSheet assessment={data} row={active} onClose={() => setActiveId(null)} /> : null}
        </SheetContent>
      </Sheet>
    </LecturerShell>
  )
}

function GradeSheet({
  assessment,
  row,
  onClose,
}: {
  assessment: LecturerAssessmentDetail
  row: LecturerAssessmentDetail['submissions'][number]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [score, setScore] = useState(row.score != null ? String(row.score) : '')
  const [feedback, setFeedback] = useState(row.feedback ?? '')
  const save = useMutation({
    mutationFn: () =>
      saveLecturerGrade(assessment.id, {
        studentId: row.studentId,
        score: Number(score),
        feedback: feedback.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success('Grade saved')
      await queryClient.invalidateQueries({ queryKey: lecturerAssessmentQueryKey(assessment.id) })
      onClose()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the grade.')),
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div style={{ padding: '20px 56px 18px 24px', borderBottom: '1px solid var(--border)' }}>
        <p className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{row.studentNumber}</p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 600, color: 'var(--foreground)' }}>{row.studentName}</h3>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Score / {assessment.totalMarks}</label>
          <Input type="number" min={0} max={assessment.totalMarks} value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div>
          <label className="t-label mb-1.5 block" style={{ color: 'var(--foreground)' }}>Feedback</label>
          <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3" style={{ padding: '16px 24px 24px' }}>
        <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
        <Button className="flex-1" disabled={score === '' || save.isPending} onClick={() => save.mutate()} style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}>Save grade</Button>
      </div>
    </div>
  )
}
