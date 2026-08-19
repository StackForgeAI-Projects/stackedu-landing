import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  ApplicationDocumentType,
  ApplicationStatus,
  ReviewApplicationRequest,
  RequestedDocuments,
} from '@stackedu/shared'
import {
  APPLICATION_DOCUMENT_LABELS,
  REQUESTABLE_APPLICATION_DOCUMENT_TYPES,
  formatDocumentTypeLabel,
  formatPaymentMethod,
  formatPaymentStatus,
  formatRequestedDocumentsList,
} from '@stackedu/shared'
import { ChevronLeft, ChevronRight, FileText, Upload } from 'lucide-react'
import { AcademicShell } from '@/components/AcademicShell'
import { ConfirmAlertDialog, type ConfirmAlertPanelProps } from '@/components/ConfirmAlertDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  academicApplicationsQueryKey,
  confirmAcademicPayment,
  decideAcademicApplication,
  getAcademicApplication,
  getAcademicDocumentUrl,
} from '@/lib/api/admissions'
import { ApplicationStatusBadge, formatApplicationStatus } from '@/lib/application-status'
import { apiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/notify'
import { queryClient } from '@/lib/query-client'
import { formatCurrency } from '@/lib/utils'

export const Route = createFileRoute('/_auth/academic/application')({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) || '' }),
  component: ApplicationDetailPage,
})

type DecisionChoice = ReviewApplicationRequest['decision']

const DECISION_OPTIONS: ReadonlyArray<{ value: DecisionChoice; label: string }> = [
  { value: 'UnderReview', label: 'Mark under review' },
  { value: 'DocumentsRequested', label: 'Request documents' },
  { value: 'Accepted', label: 'Accept' },
  { value: 'Rejected', label: 'Reject' },
]

type DecisionConfirmCopy = ConfirmAlertPanelProps & {
  title: string
  success: string
}

function decisionConfirmCopy(input: {
  decision: DecisionChoice
  applicantName: string
  hasNotes: boolean
  requestedDocumentCount: number
}): DecisionConfirmCopy {
  const { decision, applicantName, hasNotes, requestedDocumentCount } = input
  const studentNotices = [
    { icon: 'email' as const, label: `${applicantName} will receive an email about this update.` },
    { icon: 'track' as const, label: 'The update will appear on their Track application page.' },
  ]
  if (decision === 'DocumentsRequested') {
    const notices = [
      ...studentNotices,
      requestedDocumentCount > 0
        ? {
            icon: 'documents' as const,
            label: `${requestedDocumentCount} document${requestedDocumentCount === 1 ? '' : 's'} requested${hasNotes ? ', with your note at the top of the email' : ''}.`,
          }
        : null,
    ].filter(Boolean) as DecisionConfirmCopy['notices']

    return {
      title: 'Send document request?',
      tone: 'warning',
      headlineLabel: 'New status',
      headline: 'Documents requested',
      summary:
        requestedDocumentCount > 0
          ? `Ask ${applicantName} to upload the selected documents before admissions can continue.`
          : `Select at least one document before sending this request to ${applicantName}.`,
      notices,
      success: `Document request saved. ${applicantName} has been emailed and can upload from Track.`,
    }
  }

  if (decision === 'UnderReview') {
    return {
      title: 'Mark as under review?',
      tone: 'info',
      headlineLabel: 'New status',
      headline: 'Under review',
      summary: `Tell ${applicantName} that admissions is now actively reviewing their application.`,
      notices: studentNotices,
      success: `Application marked under review. ${applicantName} has been emailed about the update.`,
    }
  }

  if (decision === 'Accepted') {
    return {
      title: 'Accept this application?',
      tone: 'success',
      headlineLabel: 'New status',
      headline: 'Accepted',
      summary: `Offer ${applicantName} a place on their chosen programme.`,
      notices: studentNotices,
      caution: 'This is a final decision.',
      success: `Application accepted. ${applicantName} has been emailed about the offer.`,
    }
  }

  return {
    title: 'Reject this application?',
    tone: 'destructive',
    headlineLabel: 'New status',
    headline: 'Rejected',
    summary: `Tell ${applicantName} that their application was not successful.`,
    notices: studentNotices,
    caution: 'This is a final decision.',
    success: `Application rejected. ${applicantName} has been emailed about the decision.`,
  }
}

function detailString(details: Record<string, unknown> | null, key: string): string {
  const value = details?.[key]
  return typeof value === 'string' && value.trim() ? value : '—'
}

const ACTIVITY_PAGE_SIZES = [5, 10, 25, 50, 100] as const

function parseActivityTimestamp(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  let iso = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  if (/[+-]\d{2}$/.test(iso)) iso = `${iso}:00`

  let parsed = new Date(iso)
  if (!Number.isNaN(parsed.getTime())) return parsed

  iso = trimmed.replace(' ', 'T').replace(/\.\d+/, '')
  if (/[+-]\d{2}$/.test(iso)) iso = `${iso}:00`
  parsed = new Date(iso)
  if (!Number.isNaN(parsed.getTime())) return parsed

  return null
}

function formatActivityDateTime(value: string): string {
  const parsed = parseActivityTimestamp(value)
  if (!parsed) {
    return value.replace(/\.\d+/, '').replace(/([+-]\d{2}(?::\d{2})?)$/, '').trim()
  }
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ApplicationDetailPage() {
  const { id } = Route.useSearch()
  const [decision, setDecision] = useState<DecisionChoice>('UnderReview')
  const [comments, setComments] = useState('')
  const [requestedTypes, setRequestedTypes] = useState<ApplicationDocumentType[]>([])
  const [customDocuments, setCustomDocuments] = useState<string[]>([])
  const [otherDocumentName, setOtherDocumentName] = useState('')

  const detailQuery = useQuery({
    queryKey: [...academicApplicationsQueryKey, id],
    queryFn: () => getAcademicApplication(id),
    enabled: Boolean(id),
  })

  const app = detailQuery.data

  const decide = useMutation({
    mutationFn: () => {
      const payload: ReviewApplicationRequest = {
        decision,
        comments: comments.trim() || undefined,
      }
      if (decision === 'DocumentsRequested') {
        payload.requestedDocuments = {
          types: requestedTypes,
          custom: customDocuments,
        }
      }
      return decideAcademicApplication(id, payload)
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData([...academicApplicationsQueryKey, id], updated)
      await queryClient.invalidateQueries({ queryKey: academicApplicationsQueryKey })
      notifySuccess(
        decisionConfirmCopy({
          decision,
          applicantName: updated.fullName,
          hasNotes: Boolean(comments.trim()),
          requestedDocumentCount: requestedTypes.length + customDocuments.length,
        }).success,
      )
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

  const activity = useMemo(() => (app ? buildApplicationActivity(app) : []), [app])

  if (!id) {
    return (
      <AcademicShell pageTitle="Application">
        <div className="page-body">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Missing application id.</p>
        </div>
      </AcademicShell>
    )
  }

  if (detailQuery.isLoading || !app) {
    return (
      <AcademicShell pageTitle="Application">
        <div className="page-body">
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
            {detailQuery.isError
              ? apiErrorMessage(detailQuery.error, 'Application could not be loaded.')
              : 'Loading application…'}
          </p>
        </div>
      </AcademicShell>
    )
  }

  const finalised = app.status === 'Accepted' || app.status === 'Rejected'
  const confirmCopy = decisionConfirmCopy({
    decision,
    applicantName: app.fullName,
    hasNotes: Boolean(comments.trim()),
    requestedDocumentCount: requestedTypes.length + customDocuments.length,
  })

  const toggleRequestedType = (type: ApplicationDocumentType, checked: boolean) => {
    setRequestedTypes((current) =>
      checked ? [...new Set([...current, type])] : current.filter((entry) => entry !== type),
    )
  }

  const addCustomDocument = () => {
    const name = otherDocumentName.trim()
    if (!name) return
    setCustomDocuments((current) => [...new Set([...current, name])])
    setOtherDocumentName('')
  }

  return (
    <AcademicShell pageTitle="Application Detail">
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
          <ApplicationStatusBadge status={app.status} />
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
                            {formatDocumentTypeLabel(doc.documentType)}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {doc.fileName} · {formatActivityDateTime(doc.uploadedAt)}
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

            <SectionCard title="Activity">
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                A short history of document uploads and admissions decisions on this application.
              </p>
              <ApplicationActivityFeed rows={activity} />
            </SectionCard>
          </div>

          <aside className="flex flex-col gap-4">
            <SectionCard title="Fee">
              {app.payment ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(app.payment.amount)} · {formatPaymentMethod(app.payment.method)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Status:{' '}
                    <strong style={{ color: 'var(--foreground)' }}>
                      {formatPaymentStatus(app.payment.status)}
                    </strong>
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
                  This application already has a final decision ({formatApplicationStatus(app.status)}).
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <RadioGroup
                    value={decision}
                    onValueChange={(value) => setDecision(value as DecisionChoice)}
                    className="gap-3"
                  >
                    {DECISION_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        htmlFor={`decision-${option.value}`}
                        className="flex items-center gap-3 text-sm cursor-pointer"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <RadioGroupItem id={`decision-${option.value}`} value={option.value} />
                        {option.label}
                      </label>
                    ))}
                  </RadioGroup>

                  {decision === 'DocumentsRequested' && (
                    <div
                      className="flex flex-col gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        Select documents to request
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {REQUESTABLE_APPLICATION_DOCUMENT_TYPES.map((type) => (
                          <label key={type} className="flex items-start gap-3 text-sm cursor-pointer">
                            <Checkbox
                              checked={requestedTypes.includes(type)}
                              onCheckedChange={(checked) =>
                                toggleRequestedType(type, checked === true)
                              }
                            />
                            <span style={{ color: 'var(--foreground)' }}>
                              {APPLICATION_DOCUMENT_LABELS[type]}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="other-document">Other document</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            id="other-document"
                            placeholder="e.g. Proof of residence"
                            value={otherDocumentName}
                            onChange={(e) => setOtherDocumentName(e.target.value)}
                          />
                          <Button type="button" variant="outline" onClick={addCustomDocument}>
                            Add
                          </Button>
                        </div>
                        {customDocuments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {customDocuments.map((name) => (
                              <span
                                key={name}
                                className="text-xs px-2 py-1 rounded-full"
                                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Textarea
                    placeholder="Notes for the file (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                  <ConfirmAlertDialog
                    trigger={
                      <Button disabled={decide.isPending}>
                        {decide.isPending ? 'Saving…' : 'Save decision'}
                      </Button>
                    }
                    title={confirmCopy.title}
                    tone={confirmCopy.tone}
                    headlineLabel={confirmCopy.headlineLabel}
                    headline={confirmCopy.headline}
                    summary={confirmCopy.summary}
                    notices={confirmCopy.notices}
                    caution={confirmCopy.caution}
                    cancelLabel="Go back"
                    confirmLabel="Confirm and notify student"
                    confirmDisabled={decide.isPending}
                    onConfirm={() => decide.mutate()}
                  />
                </div>
              )}
            </SectionCard>
          </aside>
        </div>
      </div>
    </AcademicShell>
  )
}

type ActivityRow = {
  id: string
  at: string
  typeLabel: 'Upload' | 'Review'
  action: string
  details: string
}

function ApplicationActivityFeed({ rows }: { rows: ActivityRow[] }) {
  const [pageSize, setPageSize] = useState<number>(ACTIVITY_PAGE_SIZES[0])
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const from = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, rows.length)

  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        No activity yet. Uploads and decisions will show here.
      </p>
    )
  }

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: '1px solid var(--border)' }}
    >
      <div>
        {pageRows.map((entry, index) => (
          <ActivityEntry
            key={entry.id}
            entry={entry}
            isLast={index === pageRows.length - 1}
          />
        ))}
      </div>

      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
        style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(1)
            }}
            className="h-8 rounded-lg px-2 text-sm outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            aria-label="Rows per page"
          >
            {ACTIVITY_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            per page · {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
            {rows.length === 0 ? '0 entries' : `Showing ${from}–${to} of ${rows.length}`}
          </span>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', opacity: currentPage <= 1 ? 0.4 : 1 }}
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', opacity: currentPage >= totalPages ? 0.4 : 1 }}
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ActivityEntry({ entry, isLast }: { entry: ActivityRow; isLast: boolean }) {
  const Icon = entry.typeLabel === 'Upload' ? Upload : FileText
  const iconColor = entry.typeLabel === 'Upload' ? 'var(--muted-foreground)' : 'var(--info)'

  return (
    <div
      className="flex gap-3 px-3 py-3 sm:px-4"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
        style={{ width: 32, height: 32, backgroundColor: 'var(--muted)' }}
      >
        <Icon size={14} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {entry.action}
            </p>
            <span
              className="t-caption inline-flex w-fit mt-1 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: entry.typeLabel === 'Upload' ? 'var(--muted)' : 'rgba(59,130,246,0.12)',
                color: entry.typeLabel === 'Upload' ? 'var(--muted-foreground)' : 'var(--info)',
              }}
            >
              {entry.typeLabel}
            </span>
          </div>
          <p className="text-xs flex-shrink-0 sm:text-right" style={{ color: 'var(--muted-foreground)' }}>
            {formatActivityDateTime(entry.at)}
          </p>
        </div>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {entry.details}
        </p>
      </div>
    </div>
  )
}

function buildReviewActivityDetails(review: {
  reviewerName: string
  decision: ApplicationStatus
  comments: string | null
  requestedDocuments: RequestedDocuments | null
}): string {
  const note = review.comments?.trim()
  const status = formatApplicationStatus(review.decision)

  if (review.decision === 'DocumentsRequested') {
    const requested = review.requestedDocuments
      ? formatRequestedDocumentsList(review.requestedDocuments).join(', ')
      : null
    const parts = [
      `${review.reviewerName} asked the student to upload more documents before admissions can continue.`,
      requested ? `Documents needed: ${requested}.` : null,
      note ? `Note to student: ${note}` : null,
      'The student was emailed and can see this on their Track page.',
    ]
    return parts.filter(Boolean).join(' ')
  }

  if (review.decision === 'UnderReview') {
    return [
      `${review.reviewerName} marked this application as ${status}.`,
      'This tells the student that admissions is reviewing their file.',
      note ? `Note: ${note}` : null,
      'The student was emailed about this update.',
    ].filter(Boolean).join(' ')
  }

  if (review.decision === 'Accepted') {
    return [
      `${review.reviewerName} accepted this application.`,
      'The student was told they have been offered a place.',
      note ? `Note: ${note}` : null,
      'The student was emailed about the offer.',
    ].filter(Boolean).join(' ')
  }

  if (review.decision === 'Rejected') {
    return [
      `${review.reviewerName} rejected this application.`,
      'The student was told their application was not successful.',
      note ? `Note: ${note}` : null,
      'The student was emailed about the decision.',
    ].filter(Boolean).join(' ')
  }

  return [
    `${review.reviewerName} updated the application to ${status}.`,
    note ? `Note: ${note}` : null,
  ].filter(Boolean).join(' ')
}

function buildApplicationActivity(
  app: NonNullable<Awaited<ReturnType<typeof getAcademicApplication>>>,
): ActivityRow[] {
  const reviewItems: ActivityRow[] = (app.reviews ?? []).map((review) => ({
    id: review.id,
    at: review.createdAt,
    typeLabel: 'Review',
    action: formatApplicationStatus(review.decision),
    details: buildReviewActivityDetails(review),
  }))

  const uploadItems: ActivityRow[] = app.documents.map((doc) => ({
    id: `upload-${doc.id}`,
    at: doc.uploadedAt,
    typeLabel: 'Upload',
    action: 'Document uploaded',
    details: `The student uploaded their ${formatDocumentTypeLabel(doc.documentType)}. File name: ${doc.fileName}.`,
  }))

  return [...reviewItems, ...uploadItems].sort(
    (a, b) => (parseActivityTimestamp(b.at)?.getTime() ?? 0) - (parseActivityTimestamp(a.at)?.getTime() ?? 0),
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
