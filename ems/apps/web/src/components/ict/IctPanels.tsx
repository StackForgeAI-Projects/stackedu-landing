import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import type { IctAnnouncement, IctAuditDetail, IctIntegration, IctRevocation } from '@stackedu/shared'
import { buildAuditDetail } from '@stackedu/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  checkIctIntegration,
  getIctAuditEntry,
  getIctRevocation,
  getIctUser,
  ictRevocationsQueryKey,
  ictUserQueryKey,
  ictUsersQueryKey,
  ictIntegrationsQueryKey,
  resetIctUserPassword,
  restoreIctRevocation,
  revokeIctUser,
  updateIctIntegration,
  updateIctUser,
} from '@/lib/api/ict'
import { apiErrorMessage } from '@/lib/api/client'
import {
  displayRole,
  integrationLastCheckLabel,
  integrationStatusLabel,
} from '@/lib/humanize'

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <p className="t-label mb-3" style={{ color: 'var(--muted-foreground)' }}>{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      {label ? (
        <p className="t-caption mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      ) : null}
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

export function TableActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="text-sm font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[rgba(15,189,59,0.08)]"
      style={{ color: 'var(--success)' }}
    >
      {children}
    </button>
  )
}

export function IctDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] sm:max-w-xl gap-0 p-0"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>{title}</DialogTitle>
            {description ? <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription> : null}
          </DialogHeader>
        </div>
        <div className="px-6 py-5">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export function AuditEntryBody({ data }: { data: IctAuditDetail }) {
  const detail = buildAuditDetail(data)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {detail.subheadline}
      </p>
      {detail.sections.map((section) => (
        <DetailSection key={section.title} title={section.title}>
          {section.rows.map((row, index) => (
            <DetailRow key={`${section.title}-${row.label}-${index}`} label={row.label} value={row.value} />
          ))}
        </DetailSection>
      ))}
    </div>
  )
}

export function AuditEntryPanel({ id }: { id: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['ict', 'audit', id],
    queryFn: () => getIctAuditEntry(id),
    enabled: Boolean(id),
  })

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that entry.')}</p>
  if (!data) return null
  return <AuditEntryBody data={data} />
}

export function UserActionsPanel({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: ictUserQueryKey(id),
    queryFn: () => getIctUser(id),
    enabled: Boolean(id),
  })
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState<string | null>(null)

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ictUserQueryKey(id) })
    await queryClient.invalidateQueries({ queryKey: ictUsersQueryKey })
    await queryClient.invalidateQueries({ queryKey: ictRevocationsQueryKey })
  }

  const reset = useMutation({
    mutationFn: () => resetIctUserPassword(id),
    onSuccess: (result) => {
      setPassword(result.temporaryPassword)
      toast.success('Password reset. Copy the temporary password.')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not reset the password.')),
  })

  const revoke = useMutation({
    mutationFn: () => revokeIctUser(id, reason),
    onSuccess: async () => {
      toast.success('Access revoked.')
      setReason('')
      await invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not revoke access.')),
  })

  const restore = useMutation({
    mutationFn: () => updateIctUser(id, { isActive: true }),
    onSuccess: async () => {
      toast.success('Account reactivated.')
      await invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not restore the account.')),
  })

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading user…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that user.')}</p>
  if (!data) return null

  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Account">
        <DetailRow label="Email" value={data.email} />
        <DetailRow label="Role" value={displayRole(data.role)} />
        <DetailRow label="Status" value={data.isActive ? 'Active' : 'Revoked'} />
        {data.studentNumber ? <DetailRow label="Student no." value={data.studentNumber} /> : null}
        <DetailRow label="Last login" value={data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString() : 'Never'} />
      </DetailSection>

      <DetailSection title="Actions">
        <div className="flex flex-wrap gap-3 pb-2">
          <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>Reset password</Button>
          {!data.isActive ? (
            <Button disabled={restore.isPending} onClick={() => restore.mutate()}>Reactivate</Button>
          ) : null}
        </div>
        {password ? (
          <p className="t-caption" style={{ color: 'var(--success)' }}>
            Temporary password: {password}
          </p>
        ) : null}
      </DetailSection>

      {data.isActive ? (
        <DetailSection title="Revoke access">
          <Label htmlFor="revoke-reason">Reason for the auditor</Label>
          <Input
            id="revoke-reason"
            className="mb-3 mt-2"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why access is being withdrawn"
          />
          <Button disabled={reason.trim().length < 4 || revoke.isPending} onClick={() => revoke.mutate()}>
            Revoke access
          </Button>
        </DetailSection>
      ) : null}
    </div>
  )
}

export function RevocationActionsPanel({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({
    queryKey: ['ict', 'revocation', id],
    queryFn: () => getIctRevocation(id),
    enabled: Boolean(id),
  })
  const mutation = useMutation({
    mutationFn: () => restoreIctRevocation(id),
    onSuccess: async () => {
      toast.success('Access restored.')
      await queryClient.invalidateQueries({ queryKey: ictRevocationsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ictUsersQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['ict', 'revocation', id] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not restore access.')),
  })

  if (isPending) return <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
  if (error) return <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load that record.')}</p>
  if (!data) return null
  return <RevocationBody data={data} restoring={mutation.isPending} onRestore={() => mutation.mutate()} />
}

export function RevocationBody({
  data,
  restoring,
  onRestore,
}: {
  data: IctRevocation
  restoring?: boolean
  onRestore?: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Person">
        <DetailRow label="Name" value={data.userName} />
        <DetailRow label="Email" value={data.userEmail} />
        <DetailRow label="Role" value={displayRole(data.userRole)} />
      </DetailSection>
      <DetailSection title="Revocation">
        <DetailRow label="Reason" value={data.reason} />
        <DetailRow label="Effective" value={new Date(data.effectiveAt).toLocaleString()} />
        {data.revokedByName ? <DetailRow label="Revoked by" value={data.revokedByName} /> : null}
        {data.restoredAt ? <DetailRow label="Restored" value={new Date(data.restoredAt).toLocaleString()} /> : null}
        {!data.restoredAt && onRestore ? (
          <div className="pt-3">
            <Button disabled={restoring} onClick={onRestore}>Restore access</Button>
          </div>
        ) : data.restoredAt ? (
          <p className="t-body pt-2" style={{ color: 'var(--success)' }}>This access has been restored.</p>
        ) : null}
      </DetailSection>
    </div>
  )
}

export function IntegrationActionsPanel({ item }: { item: IctIntegration }) {
  const queryClient = useQueryClient()
  const toggleMutation = useMutation({
    mutationFn: (isEnabled: boolean) => updateIctIntegration(item.id, isEnabled),
    onSuccess: async () => {
      toast.success(item.isEnabled ? 'Service turned off.' : 'Service turned on.')
      await queryClient.invalidateQueries({ queryKey: ictIntegrationsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update that service.')),
  })
  const checkMutation = useMutation({
    mutationFn: () => checkIctIntegration(item.id),
    onSuccess: async () => {
      toast.success('Connection check completed.')
      await queryClient.invalidateQueries({ queryKey: ictIntegrationsQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not check that service.')),
  })

  return (
    <DetailSection title={item.displayName}>
      <DetailRow label="Status" value={integrationStatusLabel(item.isEnabled)} />
      <DetailRow label="Last check" value={integrationLastCheckLabel(item.lastStatus, item.lastCheckedAt)} />
      <div className="flex items-center justify-between gap-4 pt-3">
        <div>
          <p className="text-sm font-medium">Turn this service on</p>
          <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            API keys stay on the server and are never shown here.
          </p>
        </div>
        <Switch
          checked={item.isEnabled}
          disabled={toggleMutation.isPending}
          onCheckedChange={(checked) => toggleMutation.mutate(Boolean(checked))}
        />
      </div>
      <div className="pt-3">
        <Button variant="outline" disabled={checkMutation.isPending} onClick={() => checkMutation.mutate()}>
          Check connection
        </Button>
      </div>
    </DetailSection>
  )
}

export function AnnouncementBody({ item }: { item: IctAnnouncement }) {
  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="Delivery">
        <DetailRow label="Audience" value={item.audienceLabel} />
        <DetailRow label="Published" value={item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Draft'} />
        {item.isPinned ? <DetailRow label="Pinned" value="Shown at the top of student dashboards" /> : null}
      </DetailSection>
      <DetailSection title="Message">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.body}</p>
      </DetailSection>
    </div>
  )
}
