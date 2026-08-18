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
import { ChevronLeft, FileText } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
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

function decisionConfirmCopy(input: {
  decision: DecisionChoice
  applicantName: string
  hasNotes: boolean
  requestedDocumentCount: number
}): { title: string; lines: string[]; success: string } {
  const { decision, applicantName, hasNotes, requestedDocumentCount } = input
  const emailLine = `${applicantName} will receive an email about this update.`
  const trackLine = 'The update will also show on their Track application page.'

  if (decision === 'DocumentsRequested') {
    return {
      title: 'Send document request?',
      lines: [
        `You are about to ask ${applicantName} to upload more documents before admissions can continue.`,
        requestedDocumentCount > 0
          ? `You selected ${requestedDocumentCount} document${requestedDocumentCount === 1 ? '' : 's'} for them to upload.`
          : 'Select at least one document before you save this request.',
        hasNotes
          ? 'Your note will appear first in the email and on their Track page so they know exactly what to do.'
          : 'Add a note if you want to explain exactly what you need from the student.',
        emailLine,
        'The email will include a link where they can upload the requested files.',
        trackLine,
        'This request will be saved in the application activity history.',
      ],
      success: `Document request saved. ${applicantName} has been emailed and can upload the files from Track.`,
    }
  }

  if (decision === 'UnderReview') {
    return {
      title: 'Mark as under review?',
      lines: [
        `You are about to mark ${applicantName}'s application as Under Review.`,
        'This tells the student that admissions is actively reviewing their file.',
        emailLine,
        trackLine,
        'This update will be saved in the application activity history.',
      ],
      success: `Application marked under review. ${applicantName} has been emailed about the update.`,
    }
  }

  if (decision === 'Accepted') {
    return {
      title: 'Accept this application?',
      lines: [
        `You are about to accept ${applicantName}'s application.`,
        'This is a final decision. The student will be told that they have been offered a place.',
        emailLine,
        trackLine,
        'This decision will be saved in the application activity history.',
      ],
      success: `Application accepted. ${applicantName} has been emailed about the offer.`,
    }
  }

  return {
    title: 'Reject this application?',
    lines: [
      `You are about to reject ${applicantName}'s application.`,
      'This is a final decision. The student will be told that their application was not successful.',
      emailLine,
      trackLine,
      'This decision will be saved in the application activity history.',
    ],
    success: `Application rejected. ${applicantName} has been emailed about the decision.`,
  }
}

function detailString(details: Record<string, unknown> | null, key: string): string {
  const value = details?.[key]
  return typeof value === 'string' && value.trim() ? value : '—'
}

function formatDateTime(value: string): string {
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
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
                            {doc.fileName} · {formatDateTime(doc.uploadedAt)}
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

            <div className="flex flex-col gap-3">
              <p className="t-label" style={{ color: 'var(--muted-foreground)' }}>ACTIVITY</p>
              <p className="text-sm -mt-1" style={{ color: 'var(--muted-foreground)' }}>
                A short history of document uploads and admissions decisions on this application.
              </p>
              <DataTable
                rows={activity}
                rowKey={(row) => row.id}
                searchPlaceholder="Search activity…"
                empty="No activity yet. Uploads and decisions will show here."
                defaultPageSize={5}
                pageSizeOptions={[5, 10, 25]}
                filters={[
                  {
                    id: 'type',
                    label: 'Type',
                    allLabel: 'All activity',
                    getValue: (row) => row.typeLabel,
                  },
                ]}
                columns={ACTIVITY_TABLE_COLUMNS}
              />
            </div>
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={decide.isPending}>
                        {decide.isPending ? 'Saving…' : 'Save decision'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="flex flex-col gap-2 text-left">
                            {confirmCopy.lines.map((line) => (
                              <p key={line} className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Go back</AlertDialogCancel>
                        <AlertDialogAction onClick={() => decide.mutate()}>
                          Confirm and notify student
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

const ACTIVITY_TABLE_COLUMNS: DataTableColumn<ActivityRow>[] = [
  {
    id: 'at',
    header: 'When',
    sortable: true,
    sortValue: (row) => new Date(row.at.replace(' ', 'T')).getTime(),
    value: (row) => formatDateTime(row.at),
    className: 'whitespace-nowrap align-top',
    cell: (row) => (
      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {formatDateTime(row.at)}
      </span>
    ),
  },
  {
    id: 'action',
    header: 'What happened',
    sortable: true,
    value: (row) => row.action,
    className: 'align-top min-w-[140px]',
    cell: (row) => (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {row.action}
        </span>
        <span
          className="t-caption inline-flex w-fit px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: row.typeLabel === 'Upload' ? 'var(--muted)' : 'rgba(59,130,246,0.12)',
            color: row.typeLabel === 'Upload' ? 'var(--muted-foreground)' : 'var(--info)',
          }}
        >
          {row.typeLabel}
        </span>
      </div>
    ),
  },
  {
    id: 'details',
    header: 'What this means',
    value: (row) => row.details,
    className: 'align-top min-w-[220px]',
    cell: (row) => (
      <span className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {row.details}
      </span>
    ),
  },
]

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
    (a, b) => new Date(b.at.replace(' ', 'T')).getTime() - new Date(a.at.replace(' ', 'T')).getTime(),
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
