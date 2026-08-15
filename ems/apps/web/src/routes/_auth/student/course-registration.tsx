import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getStudentRegistration,
  registerStudentCourses,
  studentCoursesQueryKey,
  studentDashboardQueryKey,
  studentRegistrationQueryKey,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/course-registration')({
  component: CourseRegistrationPage,
})

function CourseRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: studentRegistrationQueryKey,
    queryFn: getStudentRegistration,
  })
  const [selected, setSelected] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: registerStudentCourses,
    onSuccess: async () => {
      toast.success('Courses registered.')
      await queryClient.invalidateQueries({ queryKey: studentRegistrationQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentCoursesQueryKey })
      await queryClient.invalidateQueries({ queryKey: studentDashboardQueryKey })
      void navigate({ to: '/student/courses' })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not register those courses.')),
  })

  const available = data?.offerings.filter((row) => !row.registered) ?? []
  const extraCredits = available
    .filter((row) => selected.includes(row.offeringId))
    .reduce((sum, row) => sum + row.credits, 0)

  return (
    <StudentShell pageTitle="Course registration" guide="Add offerings while registration is open and you have no fee hold. Academic Admin opens the semester; the Bursar clears holds.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>Register for courses</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading offerings…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load registration.')}</p>
        ) : data ? (
          <>
            <p className="t-body mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {data.registeredCredits} of {data.maxCredits} credits used
              {data.registrationClosesAt ? ` · closes ${data.registrationClosesAt}` : ''}
            </p>
            {data.feeHold ? (
              <p className="t-body mb-4" style={{ color: 'var(--error)' }}>A fee hold is blocking registration. Pay fees first.</p>
            ) : null}
            {!data.registrationOpen ? (
              <p className="t-body mb-4" style={{ color: 'var(--warning)' }}>Registration is closed for this semester.</p>
            ) : null}

            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3">Already registered</h2>
              {data.offerings.filter((row) => row.registered).length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>None yet.</p>
              ) : data.offerings.filter((row) => row.registered).map((row) => (
                <p key={row.offeringId} className="text-sm py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {row.code} · {row.name} · {row.credits} cr
                </p>
              ))}
            </div>

            <div className="mb-6 p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <h2 className="t-h3 mb-3">Available</h2>
              {available.length === 0 ? (
                <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>No extra offerings to add.</p>
              ) : available.map((row) => (
                <label key={row.offeringId} className="flex items-center gap-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <Checkbox
                    checked={selected.includes(row.offeringId)}
                    onCheckedChange={(checked) => {
                      setSelected((prev) =>
                        checked ? [...prev, row.offeringId] : prev.filter((id) => id !== row.offeringId),
                      )
                    }}
                  />
                  <span className="text-sm">{row.code} · {row.name} · {row.credits} cr · {row.type}</span>
                </label>
              ))}
            </div>

            <Button
              disabled={!selected.length || data.feeHold || !data.registrationOpen || data.registeredCredits + extraCredits > data.maxCredits || mutation.isPending}
              onClick={() => mutation.mutate(selected)}
            >
              Confirm registration
            </Button>
          </>
        ) : null}
      </div>
    </StudentShell>
  )
}
