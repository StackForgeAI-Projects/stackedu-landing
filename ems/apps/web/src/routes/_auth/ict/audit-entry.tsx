import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { IctShell } from '@/components/IctShell'
import { AuditEntryBody } from '@/components/ict/IctPanels'
import { getIctAuditEntry } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { buildAuditDetail } from '@stackedu/shared'

export const Route = createFileRoute('/_auth/ict/audit-entry')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: AuditEntryPage,
})

function AuditEntryPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: ['ict', 'audit', id],
    queryFn: () => getIctAuditEntry(id),
    enabled: Boolean(id),
  })

  return (
    <IctShell pageTitle="Audit entry" guide="A single append-only record. Use this when someone asks who changed what, and when.">
      <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
        <Link to="/ict/audit-log" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Audit log</Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose an entry from the audit log.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that entry.')}</p>
        ) : data ? (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <h1 className="t-h1 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{buildAuditDetail(data).headline}</h1>
            <AuditEntryBody data={data} />
          </div>
        ) : null}
      </div>
    </IctShell>
  )
}
