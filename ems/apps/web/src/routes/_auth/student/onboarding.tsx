import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { StudentShell } from '@/components/StudentShell'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  getStudentFees,
  getStudentOnboarding,
  getStudentProfile,
  getStudentRegistration,
  saveStudentOnboarding,
  studentFeesQueryKey,
  studentOnboardingQueryKey,
  studentProfileQueryKey,
  studentRegistrationQueryKey,
} from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/onboarding')({
  component: StudentOnboardingPage,
})

const STEPS = [
  { id: 'verify', title: 'Verify details', hint: 'Confirm your record' },
  { id: 'documents', title: 'Documents', hint: 'Admission files' },
  { id: 'fees', title: 'Fees', hint: 'Review your balance' },
  { id: 'register', title: 'Register', hint: 'Semester courses' },
  { id: 'library', title: 'E-Library', hint: 'Open the catalogue' },
  { id: 'handbook', title: 'Handbook', hint: 'Academic rules' },
] as const

type StepId = (typeof STEPS)[number]['id']

function StudentOnboardingPage() {
  const queryClient = useQueryClient()
  const profile = useQuery({ queryKey: studentProfileQueryKey, queryFn: getStudentProfile })
  const onboarding = useQuery({ queryKey: studentOnboardingQueryKey, queryFn: getStudentOnboarding })
  const fees = useQuery({ queryKey: studentFeesQueryKey, queryFn: getStudentFees })
  const registration = useQuery({ queryKey: studentRegistrationQueryKey, queryFn: getStudentRegistration })

  const completed = onboarding.data?.completedSteps ?? []
  const active = (STEPS.find((step) => step.id === onboarding.data?.currentStep)?.id
    ?? STEPS.find((step) => !completed.includes(step.id))?.id
    ?? STEPS[0].id) as StepId
  const progress = Math.round((completed.length / STEPS.length) * 100)

  const mutation = useMutation({
    mutationFn: saveStudentOnboarding,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentOnboardingQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save onboarding.')),
  })

  const completeStep = (stepId: StepId) => {
    const nextCompleted = completed.includes(stepId) ? completed : [...completed, stepId]
    const next = STEPS.find((step) => !nextCompleted.includes(step.id))
    mutation.mutate({
      completedSteps: nextCompleted,
      currentStep: next?.id ?? stepId,
      complete: nextCompleted.length === STEPS.length,
    })
  }

  const goToStep = (stepId: StepId) => {
    if (!completed.includes(stepId) && stepId !== active) return
    mutation.mutate({ completedSteps: completed, currentStep: stepId })
  }

  return (
    <StudentShell pageTitle="Onboarding" guide="Confirm your record, review fees, register courses and acknowledge the rules. Progress is saved to your student file.">
      <div className="px-4 sm:px-6 py-8 max-w-[840px] mx-auto">
        {profile.isPending || onboarding.isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading onboarding…</p>
        ) : profile.error || onboarding.error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>
            {apiErrorMessage(profile.error ?? onboarding.error, 'Could not load onboarding.')}
          </p>
        ) : profile.data ? (
          <>
            <div className="mb-8 animate-fade-up">
              <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Welcome, {profile.data.firstName}.
              </h1>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                Complete these steps to finish activating your student record for {profile.data.programmeName}.
              </p>
            </div>

            <div
              className="animate-fade-up p-5 sm:p-8"
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex overflow-x-auto gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                {STEPS.map((step) => {
                  const done = completed.includes(step.id)
                  const current = active === step.id
                  return (
                    <button
                      key={step.id}
                      className="flex-shrink-0 text-left"
                      onClick={() => goToStep(step.id)}
                      disabled={!done && !current}
                    >
                      <div
                        className="flex items-center justify-center rounded-full mb-2"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: done ? 'var(--success-bg)' : current ? 'var(--brand)' : 'var(--muted)',
                          color: done ? 'var(--success)' : current ? 'var(--brand-ink)' : 'var(--muted-foreground)',
                        }}
                      >
                        {done ? <CheckCircle2 size={16} /> : STEPS.findIndex((item) => item.id === step.id) + 1}
                      </div>
                      <p className="t-caption" style={{ color: current ? 'var(--brand)' : 'var(--muted-foreground)' }}>
                        {step.title}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-full overflow-hidden mb-6" style={{ height: 4, backgroundColor: 'var(--muted)' }}>
                <div className="h-full" style={{ width: `${progress}%`, backgroundColor: 'var(--brand)' }} />
              </div>

              {active === 'verify' ? (
                <StepBlock title="Verify personal details" subtitle="This is the record Admissions created for you.">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[
                      ['Full name', profile.data.fullName],
                      ['Student ID', profile.data.studentNumber],
                      ['Date of birth', profile.data.dateOfBirth ?? '—'],
                      ['Gender', profile.data.gender ?? '—'],
                      ['Phone', profile.data.phone ?? '—'],
                      ['Nationality', profile.data.nationality ?? '—'],
                      ['Programme', profile.data.programmeName],
                      ['Year', `Year ${profile.data.yearOfStudy}`],
                      ['Faculty', profile.data.facultyName ?? '—'],
                      ['Admitted', profile.data.admittedAt ?? '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="t-label mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</dt>
                        <dd className="text-sm">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Button disabled={mutation.isPending} onClick={() => completeStep('verify')}>Confirm details</Button>
                </StepBlock>
              ) : null}

              {active === 'documents' ? (
                <StepBlock title="Admission documents" subtitle="Your application files stay with the registry. Extra uploads will be added when the registry opens that step.">
                  <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
                    Confirm that the documents you submitted during admission are still correct.
                  </p>
                  <Button disabled={mutation.isPending} onClick={() => completeStep('documents')}>Documents confirmed</Button>
                </StepBlock>
              ) : null}

              {active === 'fees' ? (
                <StepBlock title="Review fees" subtitle="Pay from your fee statement. This step only confirms you have seen the balance.">
                  {fees.isPending ? (
                    <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading fees…</p>
                  ) : fees.data ? (
                    <div className="mb-6">
                      <p className="text-sm mb-1">Balance {formatCurrency(fees.data.balance)}</p>
                      <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                        Charged {formatCurrency(fees.data.totalCharged)} · paid {formatCurrency(fees.data.totalPaid)}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Link to="/student/fees"><Button variant="outline">Open fee statement</Button></Link>
                    <Button disabled={mutation.isPending} onClick={() => completeStep('fees')}>I have reviewed my fees</Button>
                  </div>
                </StepBlock>
              ) : null}

              {active === 'register' ? (
                <StepBlock title="Course registration" subtitle="Register for the current semester, then return here.">
                  {registration.data ? (
                    <p className="t-body mb-6" style={{ color: 'var(--muted-foreground)' }}>
                      {registration.data.registeredCredits} of {registration.data.maxCredits} credits registered
                      {registration.data.feeHold ? ' · a fee hold is blocking new registration.' : '.'}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Link to="/student/course-registration"><Button variant="outline">Register courses</Button></Link>
                    <Button disabled={mutation.isPending} onClick={() => completeStep('register')}>Continue</Button>
                  </div>
                </StepBlock>
              ) : null}

              {active === 'library' ? (
                <StepBlock title="E-Library" subtitle="Published catalogue items are available to enrolled students.">
                  <div className="flex flex-wrap gap-3">
                    <Link to="/student/library"><Button variant="outline">Open E-Library</Button></Link>
                    <Button disabled={mutation.isPending} onClick={() => completeStep('library')}>Continue</Button>
                  </div>
                </StepBlock>
              ) : null}

              {active === 'handbook' ? (
                <StepBlock title="Student handbook" subtitle="Academic rules are held by the registry. Acknowledge that you will follow them.">
                  {onboarding.data?.completedAt ? (
                    <p className="t-body" style={{ color: 'var(--success)' }}>Onboarding is complete.</p>
                  ) : (
                    <Button disabled={mutation.isPending} onClick={() => completeStep('handbook')}>
                      I understand the academic rules
                    </Button>
                  )}
                </StepBlock>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </StudentShell>
  )
}

function StepBlock({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="t-h3 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
      <p className="t-body mb-5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>
      {children}
    </div>
  )
}
