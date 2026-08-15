import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  getStudentAssessments,
  studentAssessmentsQueryKey,
  submitStudentAssessment,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/assignment-submit')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: AssignmentSubmitPage,
})

function AssignmentSubmitPage() {
  const { id } = Route.useSearch()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: studentAssessmentsQueryKey,
    queryFn: getStudentAssessments,
  })
  const [text, setText] = useState('')
  const selected = data?.find((row) => row.id === id)

  const mutation = useMutation({
    mutationFn: () => submitStudentAssessment(id, text),
    onSuccess: async () => {
      toast.success('Assignment submitted.')
      setText('')
      await queryClient.invalidateQueries({ queryKey: studentAssessmentsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not submit that assignment.')),
  })

  return (
    <StudentShell pageTitle="Submit assignment" guide="Choose an open assignment and send a written response. File upload will come when lecturers attach that option.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <Link to="/student/courses" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>
          ← My courses
        </Link>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Submit assignment</h1>
        <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Written submissions are saved to your course record.
        </p>

        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading assignments…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load assignments.')}</p>
        ) : !data?.length ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No open assignments accept submissions yet.</p>
        ) : !id || !selected ? (
          <div className="flex flex-col gap-3">
            {data.map((item) => (
              <Link
                key={item.id}
                to="/student/assignment-submit"
                search={{ id: item.id }}
                className="block p-5"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                <p className="t-caption mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {item.courseCode} · {item.courseName}
                  {item.dueAt ? ` · due ${item.dueAt.slice(0, 10)}` : ''}
                  {item.submitted ? ' · submitted' : ''}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <p className="t-label mb-1">{selected.courseCode}</p>
            <h2 className="t-h3 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{selected.title}</h2>
            <p className="t-caption mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {selected.courseName}
              {selected.dueAt ? ` · due ${new Date(selected.dueAt).toLocaleString()}` : ''}
            </p>
            {selected.description ? (
              <p className="text-sm mb-5 whitespace-pre-line" style={{ color: 'var(--foreground)' }}>{selected.description}</p>
            ) : null}

            {selected.submitted ? (
              <p className="t-body" style={{ color: 'var(--success)' }}>You have already submitted this assignment.</p>
            ) : (
              <>
                <Label htmlFor="response" className="mb-2 block">Your response</Label>
                <Textarea
                  id="response"
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your answer here"
                />
                <Button
                  className="mt-4"
                  disabled={!text.trim() || mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? 'Submitting…' : 'Submit assignment'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </StudentShell>
  )
}
