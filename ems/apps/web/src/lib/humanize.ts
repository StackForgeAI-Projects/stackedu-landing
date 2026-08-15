export {
  auditActionLabel,
  auditSummary,
  buildAuditDetail,
  displayRole,
} from '@stackedu/shared'

export function integrationStatusLabel(isEnabled: boolean): string {
  return isEnabled ? 'Currently on' : 'Currently off'
}

export function integrationLastCheckLabel(status: string | null, checkedAt: string | null): string {
  const when = checkedAt ? new Date(checkedAt).toLocaleString() : null
  const readable = status === 'Enabled'
    ? 'Last seen as on'
    : status === 'Disabled'
      ? 'Last seen as off'
      : status
        ? status
        : 'Not checked yet'
  if (!status && !when) return 'Not checked yet'
  return when ? `${readable} · ${when}` : readable
}
