import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ApplicationStatus, ReviewApplicationRequest } from '@stackedu/shared'
import { ChevronLeft, FileText } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ACADEMIC_ADMIN, ACADEMIC_NAV } from '@/data/academic'
import {
  academicApplicationsQueryKey,
  confirmAcademicPayment,
  decideAcademicApplication,
  getAcademicApplication,
  getAcademicDocumentUrl,
} from '@/lib/api/admissions'
import { apiErrorMessage } from '@/lib/api/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { notifyError, notifySuccess } from '@/lib/notify'
import { queryClient } from '@/lib/query-client'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/application')({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) || '' }),
  component: ApplicationDetailPage,
})

type DecisionChoice = ReviewApplicationRequest['decision']

function statusColors(status: ApplicationStatus) {
  if (status === 'Accepted') return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (status === 'Rejected') return { bg: 'var(--error-bg)', color: 'var(--error)' }
  if (status === 'DocumentsRequested') return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  if (status === 'UnderReview') return { bg: 'var(--info-bg)', color: 'var(--info)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function detailString(details: Record<string, unknown> | null, key: string): string {
  const value = details?.[key]
  return typeof value === 'string' && value.trim() ? value : '—'
}

// ─────────────────────────────────────────────────────────────────────────────

function ApplicationDetailPage() {
  const { id } = Route.useSearch()
  const { user } = useCurrentUser()
  const [decision, setDecision] = useState<DecisionChoice>('UnderReview')
  const [comments, setComments] = useState('')

  const detailQuery = useQuery({
    queryKey: [...academicApplicationsQueryKey, id],
    queryFn: () => getAcademicApplication(id),
    enabled: Boolean(id),
  })

  const app = detailQuery.data

  const decide = useMutation({
    mutationFn: () =>
      decideAcademicApplication(id, {
        decision,
        comments: comments.trim() || undefined,
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData([...academicApplicationsQueryKey, id], updated)
      await queryClient.invalidateQueries({ queryKey: academicApplicationsQueryKey })
      notifySuccess('Decision saved.')
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'Could not save that decision.'))
    },
  })

  const confirmPay = useMutation({
    mutationFn: () => confirmAcademicPayment(id),
    onSuccess: async (updated) => {
      queryClient.setQueryData([...academicApplicationsQueryKey, id], updated)
      notifySuccess('Payment marked as completed.')
    },
    onError: (error: unknown) => {
      notifyError(apiErrorMessage(error, 'Could not confirm payment.'))
    },
  })

  const name = user?.fullName ?? ACADEMIC_ADMIN.fullName
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'AA'

  if (!id) {
    return (
      <AppShell navItems={ACADEMIC_NAV} pageTitle="Application" userName={name} userRole="Academic Admin" userInitials={initials}>
        <div className="page-body">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Missing application id.</p>
        </div>
      </AppShell>
    )
  }

  if (detailQuery.isLoading || !app) {
    return (
      <AppShell navItems={ACADEMIC_NAV} pageTitle="Application" userName={name} userRole="Academic Admin" userInitials={initials}>
        <div className="page-body">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {detailQuery.isError ? 'Application could not be loaded.' : 'Loading application…'}
          </p>
        </div>
      </AppShell>
    )
  }

  const sc = statusColors(app.status)
  const finalised = app.status === 'Accepted' || app.status === 'Rejected'

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Application Detail"
      userName={name}
      userRole="Academic Admin"
      userInitials={initials}
      unreadCount={0}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={user?.institution.name ?? ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="page-body animate-fade-up">
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/academic/applications"
            className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--success)', textDecoration: 'none' }}
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />Applications
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{app.reference}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              {app.fullName}
            </h1>
            <span className="t-mono text-sm" style={{ color: 'var(--muted-foreground)' }}>{app.reference}</span>
          </div>
          <span className="t-label px-3 py-1.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>
            {app.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col gap-4 min-w-0">
            <SectionCard title="Personal details">
              <InfoGrid
                rows={[
                  { label: 'Full name', value: app.fullName },
                  { label: 'Email', value: app.email },
                  { label: 'Phone', value: app.phone },
                  { label: 'Date of birth', value: app.dateOfBirth ?? '—' },
                  { label: 'Gender', value: app.gender ?? '—' },
                  { label: 'National ID', value: app.nationalId ?? '—' },
                ]}
              />
            </SectionCard>

            <SectionCard title="Academic history">
              <InfoGrid
                rows={[
                  { label: 'Previous institution', value: app.previousInstitution ?? '—' },
                  { label: 'Qualification', value: app.previousQualification ?? '—' },
                  { label: 'Programme', value: `${app.programmeName} (${app.programmeCode})` },
                  { label: 'Guardian', value: detailString(app.details, 'guardianName') },
                  { label: 'Guardian phone', value: detailString(app.details, 'guardianPhone') },
                ]}
              />
            </SectionCard>

            <SectionCard title="Documents">
              <div className="flex flex-col gap-2">
                {app.documents.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No documents uploaded.</p>
                ) : (
                  app.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                            {doc.documentType}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { url } = await getAcademicDocumentUrl(app.id, doc.id)
                            window.open(url, '_blank', 'noopener,noreferrer')
                          } catch (error) {
                            notifyError(apiErrorMessage(error, 'Could not open that file.'))
                          }
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <aside className="flex flex-col gap-4">
            <SectionCard title="Fee">
              {app.payment ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(app.payment.amount)} · {app.payment.method}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Status: <strong style={{ color: 'var(--foreground)' }}>{app.payment.status}</strong>
                  </p>
                  <p className="t-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {app.payment.reference}
                  </p>
                  {app.payment.status !== 'Completed' && (
                    <Button
                      className="mt-2"
                      disabled={confirmPay.isPending}
                      onClick={() => confirmPay.mutate()}
                    >
                      {confirmPay.isPending ? 'Confirming…' : 'Confirm payment received'}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No payment recorded.</p>
              )}
            </SectionCard>

            <SectionCard title="Decision">
              {finalised ? (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  This application already has a final decision ({app.status}).
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {(
                    [
                      ['UnderReview', 'Mark under review'],
                      ['DocumentsRequested', 'Request documents'],
                      ['Accepted', 'Accept'],
                      ['Rejected', 'Reject'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === value}
                        onChange={() => setDecision(value)}
                      />
                      {label}
                    </label>
                  ))}
                  <Textarea
                    placeholder="Notes for the file (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={decide.isPending}>
                        {decide.isPending ? 'Saving…' : 'Save decision'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm decision</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apply status <strong>{decision}</strong> to {app.fullName}? This is recorded on the application and shown on track.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => decide.mutate()}>Confirm</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </SectionCard>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <p className="t-label mb-4" style={{ color: 'var(--muted-foreground)' }}>{title.toUpperCase()}</p>
      {children}
    </div>
  )
}

function InfoGrid({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="t-label mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{row.label}</p>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>{row.value}</p>
        </div>
      ))}
    </div>
  )
}
