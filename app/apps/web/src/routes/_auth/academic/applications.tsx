import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ApplicationStatus } from '@stackedu/shared'
import { Search } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ACADEMIC_ADMIN, ACADEMIC_NAV } from '@/data/academic'
import {
  academicApplicationsQueryKey,
  listAcademicApplications,
} from '@/lib/api/admissions'
import { useCurrentUser } from '@/hooks/useCurrentUser'

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

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

function statusColors(status: ApplicationStatus) {
  if (status === 'Accepted') return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (status === 'Rejected') return { bg: 'var(--error-bg)', color: 'var(--error)' }
  if (status === 'DocumentsRequested') return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  if (status === 'UnderReview') return { bg: 'var(--info-bg)', color: 'var(--info)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────

function ApplicationsPage() {
  const { user } = useCurrentUser()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'All'>('All')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: academicApplicationsQueryKey,
    queryFn: () => listAcademicApplications(),
  })

  const applications = query.data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applications.filter((a) => {
      const matchStatus = activeTab === 'All' || a.status === activeTab
      const matchSearch =
        !q ||
        a.fullName.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q) ||
        a.programmeName.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [applications, search, activeTab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const countFor = (s: ApplicationStatus | 'All') =>
    s === 'All'
      ? applications.length
      : applications.filter((a) => a.status === s).length

  const name = user?.fullName ?? ACADEMIC_ADMIN.fullName
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'AA'

  return (
    <AppShell
      navItems={ACADEMIC_NAV}
      pageTitle="Applications"
      userName={name}
      userRole="Academic Admin"
      userInitials={initials}
      unreadCount={0}
      infoCardLabel="ACADEMIC ADMIN"
      infoCardValue={user?.institution.name ?? ACADEMIC_ADMIN.institution}
      infoCardSubtext={ACADEMIC_ADMIN.office}
    >
      <div className="page-body animate-fade-up">
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

        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center gap-2 rounded-lg px-3 h-9 flex-1 max-w-xs"
            style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search applicant, ID or programme…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--foreground)' }}
            />
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
                onClick={() => { setActiveTab(tab.value); setPage(1) }}
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

        <div
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Application ID', 'Applicant Name', 'Programme', 'Date Submitted', 'Documents', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="t-label text-left"
                      style={{
                        color: 'var(--muted-foreground)',
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 t-body" style={{ color: 'var(--muted-foreground)' }}>
                      Loading applications…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 t-body" style={{ color: 'var(--muted-foreground)' }}>
                      No applications found
                    </td>
                  </tr>
                ) : (
                  paginated.map((app, i) => {
                    const sc = statusColors(app.status)
                    const docsComplete = app.documentCount >= 5
                    const doc = docsComplete
                      ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Complete' }
                      : { bg: 'var(--warning-bg)', color: 'var(--warning)', label: `${app.documentCount} files` }
                    return (
                      <tr
                        key={app.id}
                        style={{ borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <span className="t-mono" style={{ color: 'var(--muted-foreground)' }}>{app.reference}</span>
                        </td>
                        <td className="text-sm font-medium" style={{ color: 'var(--foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          {app.fullName}
                        </td>
                        <td className="text-sm" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          {app.programmeName}
                        </td>
                        <td className="t-caption" style={{ color: 'var(--muted-foreground)', padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          {formatDate(app.submittedAt)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="t-label px-2 py-0.5" style={{ backgroundColor: doc.bg, color: doc.color, borderRadius: 'var(--radius-sm)' }}>
                            {doc.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className="t-label px-2 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 'var(--radius-sm)' }}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Link to="/academic/application" search={{ id: app.id }}>
                            <button
                              type="button"
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent', cursor: 'pointer' }}
                            >
                              Review
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Show</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="text-sm rounded-lg px-2 h-8 outline-none"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n}>{n}</option>)}
              </select>
              <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                per page · {filtered.length} total
              </span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className="h-8 w-8 rounded-lg text-sm transition-colors duration-150"
                  style={{
                    backgroundColor: p === page ? 'var(--foreground)' : 'transparent',
                    color: p === page ? 'var(--ink-foreground)' : 'var(--muted-foreground)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
