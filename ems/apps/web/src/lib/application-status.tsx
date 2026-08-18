import type { ApplicationStatus } from '@stackedu/shared'
import { formatApplicationStatus } from '@stackedu/shared'

export function applicationStatusColors(status: ApplicationStatus) {
  if (status === 'Accepted') return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (status === 'Rejected') return { bg: 'var(--error-bg)', color: 'var(--error)' }
  if (status === 'DocumentsRequested') return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  if (status === 'UnderReview') return { bg: 'var(--info-bg)', color: 'var(--info)' }
  if (status === 'Submitted') return { bg: 'var(--info-bg)', color: 'var(--info)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const colors = applicationStatusColors(status)
  return (
    <span
      className="t-label px-3 py-1.5 inline-flex"
      style={{ backgroundColor: colors.bg, color: colors.color, borderRadius: 'var(--radius-sm)' }}
    >
      {formatApplicationStatus(status)}
    </span>
  )
}

export { formatApplicationStatus }
