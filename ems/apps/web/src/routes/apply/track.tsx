import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Application, ApplicationStatus } from '@stackedu/shared'
import { formatRequestedDocumentsList } from '@stackedu/shared'
import {
  ClipboardCheck, Clock, CreditCard, Eye, EyeOff, FileText, GraduationCap, Search, XCircle,
  AlertCircle,
} from 'lucide-react'
import { ApplyLayout } from '@/components/ApplyLayout'
import { APPLY_FEATURES, AuthHero, INSTITUTION_NAME } from '@/components/AuthHero'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApplication } from '@/hooks/useApplication'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { login, sessionQueryKey } from '@/lib/api/auth'
import { apiErrorMessage } from '@/lib/api/client'
import { dashboardFor } from '@/lib/auth/portals'
import {
  applyResumeRoute,
  buildTrackTimelineStages,
  resolveApplicationProgress,
  trackTimelineSubtitle,
} from '@/lib/apply/progress'
import { notifyError } from '@/lib/notify'
import { queryClient } from '@/lib/query-client'

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

  if (isLoading) return <FullPageWait />

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
            ? `Welcome back, ${application.fullName.split(' ')[0]}`
            : 'Your application'}
        </h2>
        <p className="t-body mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {application.programme?.name ?? 'No programme chosen yet'}
          {' · '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>{application.reference}</span>
        </p>
      </div>

      {showDocumentRequest && documentRequest ? (
        <DocumentRequestAlert request={documentRequest} />
      ) : null}

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
        ) : showDocumentRequest ? null : (
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
    body: 'Congratulations. The admissions office will be in touch with your offer and what to do next.',
  },
  Rejected: {
    tone: 'var(--muted-foreground)',
    title: 'Not successful this time',
    body: 'Your application was not successful. You are welcome to contact the admissions office to talk it through.',
  },
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
          className="mb-4 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>
            MESSAGE FROM ADMISSIONS
          </p>
          <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
            {request.comments}
          </p>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div className="mb-4">
          <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>
            DOCUMENTS TO UPLOAD
          </p>
          <ul className="flex flex-col gap-1.5">
            {documents.map((item) => (
              <li key={item} className="text-sm" style={{ color: 'var(--foreground)' }}>
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
