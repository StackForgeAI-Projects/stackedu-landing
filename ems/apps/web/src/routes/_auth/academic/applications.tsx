import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ApplicationStatus } from '@stackedu/shared'
import { AcademicShell } from '@/components/AcademicShell'
import { DataTable } from '@/components/DataTable'
import { ApplicationStatusBadge } from '@/lib/application-status'
import {
  academicApplicationsQueryKey,
  listAcademicApplications,
} from '@/lib/api/admissions'
import { apiErrorMessage } from '@/lib/api/client'

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_auth/academic/applications')({
  component: ApplicationsPage,
})

// ─────────────────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ApplicationStatus | 'All' }[] = [
  { label: 'All',                 value: 'All' },
  { label: 'Submitted',           value: 'Submitted' },
  { label: 'Under review',        value: 'UnderReview' },
  { label: 'Documents requested', value: 'DocumentsRequested' },
  { label: 'Accepted',            value: 'Accepted' },
  { label: 'Rejected',            value: 'Rejected' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────

function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'All'>('All')

  const query = useQuery({
    queryKey: academicApplicationsQueryKey,
    queryFn: () => listAcademicApplications(),
  })

  const applications = query.data ?? []

  const tabFiltered = useMemo(
    () => applications.filter((a) => activeTab === 'All' || a.status === activeTab),
    [applications, activeTab],
  )

  const countFor = (s: ApplicationStatus | 'All') =>
    s === 'All'
      ? applications.length
      : applications.filter((a) => a.status === s).length

  return (
    <AcademicShell pageTitle="Applications">
      <div className="page-body animate-fade-up">
        {query.isError ? (
          <p className="t-body mb-4" style={{ color: 'var(--error)' }}>
            {apiErrorMessage(query.error, 'Could not load applications.')}
          </p>
        ) : null}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', letterSpacing: '-0.015em' }}>
              Applications
            </h1>
            <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
              Review and manage student admission applications
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.value
            const cnt = countFor(tab.value)
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{
                  backgroundColor: active ? 'var(--foreground)' : 'transparent',
                  color: active ? 'var(--ink-foreground)' : 'var(--muted-foreground)',
                  border: active ? '1px solid var(--foreground)' : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
                <span
                  className="t-label px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'var(--muted)',
                    color: active ? '#fff' : 'var(--muted-foreground)',
                    fontSize: 10,
                  }}
                >
                  {cnt}
                </span>
              </button>
            )
          })}
        </div>

        <DataTable
          rows={tabFiltered}
          rowKey={(app) => app.id}
          searchPlaceholder="Search applicant, ID or programme…"
          searchFilter={(app, query) =>
            app.fullName.toLowerCase().includes(query) ||
            app.reference.toLowerCase().includes(query) ||
            app.programmeName.toLowerCase().includes(query)
          }
          empty={query.isLoading ? 'Loading applications…' : 'No applications found'}
          defaultPageSize={10}
          columns={[
            {
              id: 'reference',
              header: 'Application ID',
              value: (app) => app.reference,
              cell: (app) => <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{app.reference}</span>,
            },
            {
              id: 'name',
              header: 'Applicant Name',
              value: (app) => app.fullName,
              cell: (app) => <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--foreground)' }}>{app.fullName}</span>,
            },
            {
              id: 'programme',
              header: 'Programme',
              value: (app) => app.programmeName,
              cell: (app) => <span className="text-sm whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{app.programmeName}</span>,
            },
            {
              id: 'submitted',
              header: 'Date Submitted',
              value: (app) => formatDate(app.submittedAt),
              cell: (app) => <span className="t-caption whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{formatDate(app.submittedAt)}</span>,
            },
            {
              id: 'documents',
              header: 'Documents',
              value: (app) => (app.documentCount >= 5 ? 'Complete' : `${app.documentCount} files`),
              cell: (app) => {
                const docsComplete = app.documentCount >= 5
                const doc = docsComplete
                  ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Complete' }
                  : { bg: 'var(--warning-bg)', color: 'var(--warning)', label: `${app.documentCount} files` }
                return <span className="t-label px-2 py-0.5" style={{ backgroundColor: doc.bg, color: doc.color, borderRadius: 'var(--radius-sm)' }}>{doc.label}</span>
              },
            },
            {
              id: 'status',
              header: 'Status',
              value: (app) => app.status,
              cell: (app) => <ApplicationStatusBadge status={app.status} />,
            },
            {
              id: 'review',
              header: '',
              className: 'text-right',
              cell: (app) => (
                <Link to="/academic/application" search={{ id: app.id }}>
                  <button
                    type="button"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                    style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                  >
                    Review
                  </button>
                </Link>
              ),
            },
          ]}
        />
      </div>
    </AcademicShell>
  )
}
