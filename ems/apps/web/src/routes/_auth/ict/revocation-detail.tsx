import { createFileRoute, Link } from '@tanstack/react-router'
import { IctShell } from '@/components/IctShell'
import { RevocationActionsPanel } from '@/components/ict/IctPanels'

export const Route = createFileRoute('/_auth/ict/revocation-detail')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: RevocationDetailPage,
})

function RevocationDetailPage() {
  const { id } = Route.useSearch()

  return (
    <IctShell pageTitle="Revocation" guide="Review why access was withdrawn. Restore only when the person should sign in again.">
      <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
        <Link to="/ict/revocation" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Revocations</Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose a revocation from the list.</p>
        ) : (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <RevocationActionsPanel id={id} />
          </div>
        )}
      </div>
    </IctShell>
  )
}
