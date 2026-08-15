import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DataTable } from '@/components/DataTable'
import { IctShell } from '@/components/IctShell'
import { IctDialog, RevocationActionsPanel, TableActionButton } from '@/components/ict/IctPanels'
import { getIctRevocations, ictRevocationsQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { roleLabel } from '@/lib/auth/portals'

export const Route = createFileRoute('/_auth/ict/revocation')({
  component: RevocationPage,
})

function RevocationPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ictRevocationsQueryKey,
    queryFn: getIctRevocations,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = data?.find((row) => row.id === selectedId)

  return (
    <IctShell
      pageTitle="Revocation"
      guide="Every access withdrawal is kept here with the reason. Restore a person from the row action. This list is the record an auditor will ask for."
    >
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Access revocation</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading revocations…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load revocations.')}</p>
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(row) => row.id}
            searchPlaceholder="Search name, email or reason…"
            searchFilter={(row, query) => `${row.userName} ${row.userEmail} ${row.reason}`.toLowerCase().includes(query)}
            filters={[
              { id: 'role', label: 'roles', getValue: (row) => roleLabel(row.userRole) },
              { id: 'status', label: 'statuses', getValue: (row) => row.restoredAt ? 'Restored' : 'Active' },
            ]}
            empty="No revocations recorded yet."
            columns={[
              { id: 'name', header: 'Name', value: (row) => row.userName, sortable: true, cell: (row) => <span className="font-medium">{row.userName}</span> },
              { id: 'role', header: 'Role', value: (row) => roleLabel(row.userRole), cell: (row) => roleLabel(row.userRole) },
              { id: 'status', header: 'Status', value: (row) => row.restoredAt ? 'Restored' : 'Active', cell: (row) => row.restoredAt ? 'Restored' : 'Active' },
              {
                id: 'when',
                header: 'Effective',
                value: (row) => row.effectiveAt,
                sortable: true,
                cell: (row) => new Date(row.effectiveAt).toLocaleString(),
              },
              { id: 'reason', header: 'Reason', value: (row) => row.reason, cell: (row) => <span className="line-clamp-2">{row.reason}</span> },
              {
                id: 'open',
                header: '',
                cell: (row) => <TableActionButton onClick={() => setSelectedId(row.id)}>Manage</TableActionButton>,
                className: 'text-right',
              },
            ]}
          />
        )}
      </div>

      <IctDialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        title={selected?.userName ?? 'Revocation'}
        description="Review why access was withdrawn. Restore only when the person should sign in again."
      >
        {selectedId ? <RevocationActionsPanel id={selectedId} /> : null}
      </IctDialog>
    </IctShell>
  )
}
