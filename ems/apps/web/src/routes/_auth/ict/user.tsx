import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { IctShell } from '@/components/IctShell'
import { UserActionsPanel } from '@/components/ict/IctPanels'
import { getIctUser, ictUserQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/ict/user')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: UserDetailPage,
})

function UserDetailPage() {
  const { id } = Route.useSearch()
  const { data, isPending, error } = useQuery({
    queryKey: ictUserQueryKey(id),
    queryFn: () => getIctUser(id),
    enabled: Boolean(id),
  })

  return (
    <IctShell
      pageTitle="User"
      guide="Reset a password, revoke access, or reactivate an account. Revoking ends every open session for that person immediately."
    >
      <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
        <Link to="/ict/users" className="t-caption mb-4 inline-block" style={{ color: 'var(--success)' }}>← Users</Link>
        {!id ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Choose a user from the list.</p>
        ) : isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading user…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that user.')}</p>
        ) : data ? (
          <div className="p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <h1 className="t-h1 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{data.fullName}</h1>
            <UserActionsPanel id={id} />
          </div>
        ) : null}
      </div>
    </IctShell>
  )
}
