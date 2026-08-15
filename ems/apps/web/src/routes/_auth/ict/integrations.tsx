import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { IctShell } from '@/components/IctShell'
import { IctDialog, IntegrationActionsPanel } from '@/components/ict/IctPanels'
import { getIctIntegrations, ictIntegrationsQueryKey } from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import { integrationStatusLabel } from '@/lib/humanize'
import type { IctIntegration } from '@stackedu/shared'

export const Route = createFileRoute('/_auth/ict/integrations')({
  component: IntegrationsPage,
})

function IntegrationsPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ictIntegrationsQueryKey,
    queryFn: getIctIntegrations,
  })
  const [selected, setSelected] = useState<IctIntegration | null>(null)
  const current = data?.find((item) => item.id === selected?.id) ?? selected

  return (
    <IctShell
      pageTitle="Integrations"
      guide="Turn connected services on or off. API secrets stay in the server environment and are never stored or shown here."
    >
      <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Integrations</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading integrations…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load integrations.')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(data ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                className="block p-5 text-left w-full"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}
                onClick={() => setSelected(item)}
              >
                <p className="text-sm font-semibold">{item.displayName}</p>
                <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
                  {integrationStatusLabel(item.isEnabled)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <IctDialog
        open={Boolean(current)}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
        title={current?.displayName ?? 'Connected service'}
        description="Enable or disable this service. Credentials are not entered in the browser."
      >
        {current ? <IntegrationActionsPanel item={current} /> : null}
      </IctDialog>
    </IctShell>
  )
}
