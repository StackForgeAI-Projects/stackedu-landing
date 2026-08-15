import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/DataTable'
import { IctShell } from '@/components/IctShell'
import { StatTile } from '@/components/StatTile'
import { Activity, FileText, Plug, UserPlus, Users, UserX } from 'lucide-react'
import { getIctAnalytics, ictAnalyticsQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/portals'

export const Route = createFileRoute('/_auth/ict/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ictAnalyticsQueryKey,
    queryFn: getIctAnalytics,
  })

  return (
    <IctShell
      pageTitle="Analytics"
      guide="Live platform activity for this institution — sign-ins, new accounts, audit volume, and connected services."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Platform analytics</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading analytics…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load analytics.')}</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              <StatTile icon={Users} iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)" label="TOTAL USERS" value={String(data.totalUsers)} />
              <StatTile icon={Activity} iconColor="var(--info)" iconBg="var(--info-bg)" label="ACTIVE SESSIONS" value={String(data.activeSessions)} />
              <StatTile icon={UserX} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="PENDING REVOCATIONS" value={String(data.pendingRevocations)} />
              <StatTile icon={UserPlus} iconColor="var(--success)" iconBg="var(--success-bg)" label="LOGINS (7 DAYS)" value={String(data.loginsLast7Days)} />
              <StatTile icon={Users} iconColor="var(--info)" iconBg="var(--info-bg)" label="NEW USERS (30 DAYS)" value={String(data.newUsersLast30Days)} />
              <StatTile icon={FileText} iconColor="var(--foreground)" iconBg="var(--muted)" label="AUDIT EVENTS (30 DAYS)" value={String(data.auditEventsLast30Days)} />
              <StatTile icon={Plug} iconColor="var(--brand)" iconBg="rgba(15, 189, 59,0.08)" label="SERVICES ON" value={`${data.integrationsEnabled}/${data.integrationsTotal}`} />
            </div>
            <h2 className="t-h3 mb-3">Accounts by role</h2>
            <DataTable
              rows={data.usersByRole}
              rowKey={(row) => row.role}
              searchPlaceholder="Filter roles…"
              columns={[
                { id: 'role', header: 'Role', value: (row) => roleLabel(row.role), sortable: true, cell: (row) => roleLabel(row.role) },
                { id: 'count', header: 'Accounts', value: (row) => row.count, sortable: true, sortValue: (row) => row.count, cell: (row) => <span className="t-mono">{row.count}</span> },
              ]}
            />
          </>
        ) : null}
      </div>
    </IctShell>
  )
}
