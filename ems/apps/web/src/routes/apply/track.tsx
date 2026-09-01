import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Application, ApplicationStatus } from '@stackedu/shared'
import { formatRequestedDocumentsList, titleAndFirstName } from '@stackedu/shared'
import {
  ClipboardCheck, Clock, CreditCard, Eye, EyeOff, FileText, GraduationCap, Search, XCircle,
  AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react'
import { ApplyLayout } from '@/components/ApplyLayout'
import { APPLY_FEATURES, AuthHero, INSTITUTION_NAME } from '@/components/AuthHero'
import { BrandMark } from '@/components/BrandMark'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApplication } from '@/hooks/useApplication'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { acceptAdmissionOffer, declineAdmissionOffer } from '@/lib/api/admissions'
import { login, sessionQueryKey } from '@/lib/api/auth'
import { apiErrorMessage } from '@/lib/api/client'
import { dashboardFor } from '@/lib/auth/portals'
import { clearDismissedPageGuides } from '@/lib/page-guide'
import {
  applyResumeRoute,
  buildTrackTimelineStages,
  resolveApplicationProgress,
  trackTimelineSubtitle,
} from '@/lib/apply/progress'
import { notifyError } from '@/lib/notify'
import { rememberNewStudentWelcome } from '@/lib/new-student-welcome'
import { queryClient } from '@/lib/query-client'
import { performSignOutRedirect } from '@/lib/session-logout'

const PREPARING_MESSAGES = [
  'Creating your student profile…',
  'Preparing your dashboard…',
  'Setting up fee and registration access…',
  'Almost ready…',
] as const

const PREPARING_MIN_MS = 8000

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/apply/track')({
  component: ApplyTrackPage,
})

/**
 * Tracking is behind a sign-in.
 *
 * An application holds a date of birth, a national ID and a home address, so
 * it is not something to hand over to anyone who knows a reference number.
 */
function ApplyTrackPage() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <FullPageWait />
  if (!user || user.role !== 'Applicant') return <ApplicantSignIn />
  return <ApplicationStatusView />
}

function FullPageWait() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ color: 'var(--muted-foreground)' }}
      />
    </div>
  )
}

// ── Signed out — same split layout as the apply screen ────────────────────────

function ApplicantSignIn() {
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const signedIn = await login({ identifier, password, rememberMe: false })
      if ('requiresTwoFactor' in signedIn) {
        await navigate({ to: '/verify' })
        return
      }
      queryClient.setQueryData(sessionQueryKey, signedIn)
      clearDismissedPageGuides()

      // Staff and students who land here belong somewhere else.
      if (signedIn.role !== 'Applicant') {
        await navigate({ to: dashboardFor(signedIn.role) })
        return
      }
      await queryClient.invalidateQueries()
    } catch (cause) {
      notifyError(apiErrorMessage(cause, 'We could not sign you in. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthHero
        title="Track your application"
        subtitle={`Sign in to see how your application to ${INSTITUTION_NAME} is going`}
        features={APPLY_FEATURES}
        logoTo="/"
        logoAriaLabel="Go to sign in"
      />

      <div
        className="flex lg:w-[58%] flex-1 flex-col p-8 sm:p-12"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* On desktop the hero panel carries the mark instead. */}
        <div className="mb-8 lg:hidden">
          <BrandMark
            to="/"
            size={32}
            ariaLabel="Go to sign in"
            wordmarkColor="var(--foreground)"
            wordmarkClassName="text-base font-bold tracking-tight"
          />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[420px] animate-fade-up">
            <div className="mb-6">
              <p
                className="text-sm font-medium mb-1 lg:hidden"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {INSTITUTION_NAME}
              </p>
              <h2
                className="t-h1 mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                Track your application
              </h2>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                Sign in with the email or Application ID from when you applied.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="track-id">Email address or Application ID</Label>
                <Input
                  id="track-id"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@email.com or APP-2026-00000"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="track-pass">Password</Label>
                <div className="relative">
                  <Input
                    id="track-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{
                      color: 'var(--muted-foreground)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm mt-1 transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="my-5" style={{ height: 1, backgroundColor: 'var(--border)' }} />

            <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Not applied yet?{' '}
              <Link
                to="/apply"
                className="font-medium transition-opacity hover:opacity-70"
                style={{ color: '#0D7A28', textDecoration: 'none' }}
              >
                Apply now
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          Powered by{' '}
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
            StackForgeAI
          </span>
        </p>
      </div>
    </div>
  )
}

// ── Signed in — the real state of the real application ───────────────────────

function ApplicationStatusView() {
  const { application, isLoading } = useApplication()

  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false)
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false)
  const [preparingDashboard, setPreparingDashboard] = useState(false)
  const [preparingMessageIndex, setPreparingMessageIndex] = useState(0)

  useEffect(() => {
    if (!preparingDashboard) return
    const timer = window.setInterval(() => {
      setPreparingMessageIndex((current) => (current + 1) % PREPARING_MESSAGES.length)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [preparingDashboard])

  const runAcceptAdmission = useCallback(async () => {
    setConfirmAcceptOpen(false)
    setPreparingDashboard(true)
    setPreparingMessageIndex(0)

    try {
      const [result] = await Promise.all([
        acceptAdmissionOffer(),
        new Promise<void>((resolve) => window.setTimeout(resolve, PREPARING_MIN_MS)),
      ])
      rememberNewStudentWelcome(result.studentNumber)
      window.location.replace('/student/dashboard')
    } catch (error: unknown) {
      setPreparingDashboard(false)
      notifyError(apiErrorMessage(error, 'We could not accept your admission. Please try again.'))
    }
  }, [])

  const declineAdmission = useMutation({
    mutationFn: declineAdmissionOffer,
    onSuccess: async () => {
      setConfirmRejectOpen(false)
      await performSignOutRedirect('/login')
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'We could not decline your admission. Please try again.'))
    },
  })

  if (isLoading) return <FullPageWait />

  if (preparingDashboard) {
    return <PreparingDashboardOverlay message={PREPARING_MESSAGES[preparingMessageIndex]!} />
  }

  if (!application) {
    return (
      <ApplyLayout showSidebar={false} showBanner={false}>
        <Card>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            We could not find an application on your account.
          </p>
          <Link to="/apply/form" search={{ step: undefined }} className="mt-4 inline-block">
            <Button className="font-semibold">Start your application</Button>
          </Link>
        </Card>
      </ApplyLayout>
    )
  }

  const isDraft = application.status === 'Draft'
  const documentRequest = application.documentRequest
  const showDocumentRequest =
    application.status === 'DocumentsRequested' && Boolean(documentRequest)
  const documentResponseSubmitted = Boolean(documentRequest?.responseSubmittedAt)
  const pendingAdmissionOffer =
    application.status === 'Accepted' &&
    Boolean(application.admissionOffer) &&
    !application.admissionOffer?.acceptedAt &&
    !application.admissionOffer?.declinedAt
  const declinedAdmissionOffer =
    application.status === 'Accepted' && Boolean(application.admissionOffer?.declinedAt)
  const progress = resolveApplicationProgress(application)
  const resumeTo = applyResumeRoute(progress.currentStep)

  return (
    <ApplyLayout
      showSidebar={false}
      showBanner={false}
      progressPercent={progress.progressPercent}
      currentStep={progress.currentStep}
      completedSteps={progress.completedSteps}
    >
      <div className="mb-6">
        <h2
          className="t-h2"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--foreground)',
            letterSpacing: '-0.01em',
          }}
        >
          {application.fullName.split(' ')[0]
            ? `Welcome back, ${titleAndFirstName(application.fullName)}`
            : 'Your application'}
        </h2>
        <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {application.programme?.name ?? 'No programme chosen yet'}
          {' · '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>{application.reference}</span>
        </p>
      </div>

      {showDocumentRequest && documentRequest ? (
        documentResponseSubmitted ? (
          <DocumentResponseSubmittedAlert />
        ) : (
          <DocumentRequestAlert request={documentRequest} />
        )
      ) : null}

      {pendingAdmissionOffer ? (
        <AdmissionOfferAlert
          busy={declineAdmission.isPending}
          onAccept={() => setConfirmAcceptOpen(true)}
          onReject={() => setConfirmRejectOpen(true)}
        />
      ) : null}

      {declinedAdmissionOffer ? <DeclinedOfferAlert /> : null}

      <ConfirmAlertDialog
        open={confirmAcceptOpen}
        onOpenChange={setConfirmAcceptOpen}
        title="Accept your admission?"
        tone="success"
        headlineLabel="Confirm acceptance"
        headline="Become a registered student"
        summary="You are accepting your place at the institution. This creates your student record and gives you access to the student portal."
        notices={[
          { icon: 'shield', label: 'You will receive a student number and can sign in to pay fees.' },
          { icon: 'file', label: 'You can register for courses from your student dashboard after accepting.' },
          { icon: 'clock', label: 'This step cannot be undone from Application Track — contact admissions if you change your mind.' },
        ]}
        cancelLabel="Go back"
        confirmLabel="Yes, accept admission"
        confirmVariant="brand"
        onConfirm={(event) => {
          event.preventDefault()
          void runAcceptAdmission()
        }}
      />

      <ConfirmAlertDialog
        open={confirmRejectOpen}
        onOpenChange={setConfirmRejectOpen}
        title="Decline your admission?"
        tone="destructive"
        headlineLabel="Confirm decline"
        headline="Release your place"
        summary="You are declining the admission offer. Your application will stay on file, but the place may be offered to another applicant."
        notices={[
          { icon: 'email', label: 'We will email you a confirmation of this decision.' },
          { icon: 'lock', label: 'You will be signed out and can sign in again as an applicant.' },
          { icon: 'info', label: 'Contact admissions before the offer expires if you change your mind.' },
        ]}
        caution="This does not delete your application — it records that you declined the offer."
        cancelLabel="Go back"
        confirmLabel={declineAdmission.isPending ? 'Declining…' : 'Yes, decline offer'}
        confirmVariant="destructive"
        loading={declineAdmission.isPending}
        onConfirm={(event) => {
          event.preventDefault()
          declineAdmission.mutate()
        }}
      />

      <StatusTimeline application={application} />

      <div className="mt-6">
        {isDraft ? (
          <Card accent="var(--warning)">
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--warning)' }}>
              Not finished yet
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
              Your application has been saved but not sent. You can pick up where you left off, and
              nothing is reviewed until you send it.
            </p>
            <Link to={resumeTo} className="mt-4 inline-block">
              <Button className="font-semibold">Continue application</Button>
            </Link>
          </Card>
        ) : showDocumentRequest || pendingAdmissionOffer || declinedAdmissionOffer ? null : (
          <StatusMessage application={application} />
        )}
      </div>
    </ApplyLayout>
  )
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        ...(accent ? { borderLeft: `4px solid ${accent}` } : {}),
      }}
    >
      {children}
    </div>
  )
}

/** Plain-language wording for each state the institution can put it in. */
const STATUS_MESSAGES: Record<
  Exclude<ApplicationStatus, 'Draft'>,
  { tone: string; title: string; body: string }
> = {
  Submitted: {
    tone: 'var(--info)',
    title: 'Sent for review',
    body: 'The admissions office has your application. We will let you know as soon as there is a decision.',
  },
  UnderReview: {
    tone: 'var(--info)',
    title: 'Being reviewed',
    body: 'Someone is reading your application now. There is nothing further for you to do.',
  },
  DocumentsRequested: {
    tone: 'var(--warning)',
    title: 'More documents needed',
    body: 'The admissions office has asked for extra documents before they can decide.',
  },
  Accepted: {
    tone: 'var(--success)',
    title: 'You have been offered a place',
    body: 'Congratulations. Accept your admission offer to receive your student number and continue with registration.',
  },
  Rejected: {
    tone: 'var(--muted-foreground)',
    title: 'Not successful this time',
    body: 'Your application was not successful. You are welcome to contact the admissions office to talk it through.',
  },
}

function PreparingDashboardOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full mb-6"
        style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--success)' }} />
      </div>
      <h2
        className="t-h2 mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Preparing your dashboard
      </h2>
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {message}
      </p>
      <p className="text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>
        This usually takes a few seconds…
      </p>
    </div>
  )
}

function AdmissionOfferAlert({
  busy,
  onAccept,
  onReject,
}: {
  busy: boolean
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div
      className="mb-6 p-5 sm:p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--success-bg)',
        border: '1px solid var(--success)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 36, height: 36, backgroundColor: 'rgba(13,122,40,0.15)' }}
        >
          <GraduationCap size={18} style={{ color: 'var(--success)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
            Respond to your admission offer
          </p>
          <p className="text-sm mt-2 font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
            Admissions has offered you a place. Accept to become a registered student and access fees and
            course registration. Decline if you no longer wish to take up the place.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button className="w-full sm:w-auto font-semibold" disabled={busy} onClick={onAccept}>
          Accept admission
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto font-semibold"
          disabled={busy}
          onClick={onReject}
          style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error)',
            color: 'var(--error)',
          }}
        >
          Decline offer
        </Button>
      </div>
    </div>
  )
}

function DeclinedOfferAlert() {
  return (
    <div
      className="mb-6 p-5 sm:p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--muted)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
        You declined this admission offer
      </p>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        We emailed you a confirmation. Contact the admissions office before the offer expiry if you change
        your mind.
      </p>
    </div>
  )
}

function DocumentResponseSubmittedAlert() {
  return (
    <div
      className="mb-6 p-5 sm:p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--info-bg, #eff6ff)',
        border: '1px solid var(--info, #2563eb)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 36, height: 36, backgroundColor: 'rgba(37,99,235,0.12)' }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--info, #2563eb)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--info, #2563eb)' }}>
            Documents submitted — under review
          </p>
          <p className="text-sm mt-2 font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
            We have received your updated documents. Admissions will review them and get back to you.
            There is nothing else for you to do right now.
          </p>
        </div>
      </div>
    </div>
  )
}

function DocumentRequestAlert({
  request,
}: {
  request: NonNullable<Application['documentRequest']>
}) {
  const documents = formatRequestedDocumentsList(request.requestedDocuments)

  return (
    <div
      className="mb-6 p-5 sm:p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--warning-bg)',
        border: '1px solid var(--warning)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 36, height: 36, backgroundColor: 'rgba(245,158,11,0.15)' }}
        >
          <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
            Action required — documents requested
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Admissions needs updated documents before they can continue your application.
          </p>
        </div>
      </div>

      {request.comments ? (
        <div
          className="mb-4 pl-4 pr-3 py-3 rounded-lg"
          style={{
            borderLeft: '3px solid var(--warning)',
            backgroundColor: 'rgba(245,158,11,0.14)',
          }}
        >
          <p className="t-label mb-1.5" style={{ color: '#92400e' }}>
            Message from admissions
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
            {request.comments}
          </p>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div
          className="mb-4 pl-4 pr-3 py-3 rounded-lg"
          style={{
            borderLeft: '3px solid rgba(245,158,11,0.45)',
            backgroundColor: 'rgba(245,158,11,0.08)',
          }}
        >
          <p className="t-label mb-2" style={{ color: '#92400e' }}>
            Documents to upload
          </p>
          <ul className="flex flex-col gap-1.5">
            {documents.map((item) => (
              <li key={item} className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                • {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Link to="/apply/documents" className="block sm:inline-block">
        <Button className="w-full sm:w-auto font-semibold">Upload requested documents</Button>
      </Link>
    </div>
  )
}

function StatusMessage({ application }: { application: Application }) {
  if (application.status === 'Draft') return null
  const message = STATUS_MESSAGES[application.status]

  return (
    <Card accent={message.tone}>
      <p className="text-sm font-semibold mb-1" style={{ color: message.tone }}>
        {message.title}
      </p>
      <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
        {message.body}
      </p>
    </Card>
  )
}

// ── Timeline ─────────────────────────────────────────────────────────────────

const TRACK_STAGE_ICONS = {
  started: FileText,
  payment: CreditCard,
  sent: Search,
  reviewed: ClipboardCheck,
  decision: GraduationCap,
} as const

function StatusTimeline({ application }: { application: NonNullable<ReturnType<typeof useApplication>['application']> }) {
  const decided = application.status === 'Accepted' || application.status === 'Rejected'
  const stages = buildTrackTimelineStages(application).map((stage) => ({
    ...stage,
    icon: stage.key === 'decision' && decided && application.status === 'Rejected'
      ? XCircle
      : TRACK_STAGE_ICONS[stage.key],
  }))

  const activeIndex = stages.findIndex((stage) => !stage.done)

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <p className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>
        Progress
      </p>
      <div className="flex flex-col gap-0">
        {stages.map((stage, i) => {
          const active = i === activeIndex
          const last = i === stages.length - 1
          const Icon = stage.icon

          const circleColor = stage.done || active ? '#0D7A28' : 'var(--muted)'
          const labelColor = stage.done
            ? 'var(--success)'
            : active
              ? '#0D7A28'
              : 'var(--muted-foreground)'

          return (
            <div key={stage.key} className="flex gap-4">
              <div className="flex flex-col items-center" style={{ width: 24, flexShrink: 0 }}>
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: circleColor,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {active && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: '#0D7A28', opacity: 0.3 }}
                    />
                  )}
                  <Icon
                    size={12}
                    style={{
                      color:
                        stage.done || active ? '#FFFFFF' : 'var(--muted-foreground)',
                      position: 'relative',
                    }}
                  />
                </div>
                {!last && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      backgroundColor: stage.done ? '#0D7A28' : 'var(--muted)',
                      margin: '2px 0',
                    }}
                  />
                )}
              </div>

              <div className="pb-6" style={{ paddingTop: 2 }}>
                <p className="text-sm font-semibold" style={{ color: labelColor }}>
                  {stage.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {trackTimelineSubtitle(stage, active)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {application.status === 'Submitted' && (
        <p className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <Clock size={12} />
          Most applications are reviewed within 5–7 working days.
        </p>
      )}
    </div>
  )
}
