import type { UserRole } from './enums'

export interface AuditCopyInput {
  action: string
  actorEmail?: string | null
  actorRole?: string | null
  targetType?: string | null
  targetId?: string | null
  createdAt?: string
  changes?: Record<string, { from?: unknown; to?: unknown }> | null
  metadata?: Record<string, unknown> | null
}

export interface AuditDetailSection {
  title: string
  rows: Array<{ label: string; value: string }>
}

export interface AuditDetailView {
  headline: string
  subheadline: string
  sections: AuditDetailSection[]
}

const ROLE_LABELS: Record<UserRole, string> = {
  Applicant: 'Applicant',
  Student: 'Student',
  Lecturer: 'Lecturer',
  Bursar: 'Bursar',
  AcademicAdmin: 'Academic Admin',
  Librarian: 'Librarian',
  ICTManager: 'ICT Manager',
}

const KNOWN_ROLES = Object.keys(ROLE_LABELS) as UserRole[]

function humanizeKey(value: string): string {
  const words = value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[.\s]+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase())
  if (!words.length) return 'Updated a record'
  return words.join(' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function displayRole(role: string | null | undefined): string {
  if (!role) return 'System'
  if (KNOWN_ROLES.includes(role as UserRole)) return ROLE_LABELS[role as UserRole]
  return humanizeKey(role)
}

function looksLikeId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    || /^[0-9a-f]{20,}$/i.test(value)
}

function formatPlainValue(value: unknown): string {
  if (value == null || value === '') return 'not set'
  if (typeof value === 'boolean') return value ? 'on' : 'off'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    if (looksLikeId(value)) return 'a saved record'
    if (value === 'en') return 'English'
    if (value === 'fr') return 'French'
    if (value === 'rw') return 'Kinyarwanda'
    if (KNOWN_ROLES.includes(value as UserRole)) return ROLE_LABELS[value as UserRole]
    if (value.includes('.') && value.length < 80 && !value.includes(' ')) return humanizeKey(value)
    return value
  }
  if (Array.isArray(value)) {
    if (!value.length) return 'none'
    return value.map(formatPlainValue).join(', ')
  }
  return 'updated details'
}

function integrationName(input: AuditCopyInput): string | null {
  const name = input.metadata?.integrationName
  return typeof name === 'string' && name.trim() ? name : null
}

function subjectName(input: AuditCopyInput): string {
  if (input.targetType === 'integration') {
    return integrationName(input) ?? 'Connected service'
  }
  if (input.targetType === 'role' && input.targetId) {
    return displayRole(input.targetId)
  }
  if (input.targetType === 'institution') return 'Institution settings'
  if (input.targetType === 'announcement') {
    const title = input.metadata?.title
    if (typeof title === 'string' && title.trim()) return `"${title}"`
    return 'Announcement'
  }
  if (input.targetType === 'user') {
    const email = input.metadata?.email
    const fullName = input.metadata?.fullName
    if (typeof fullName === 'string' && fullName.trim()) return fullName
    if (typeof email === 'string' && email.trim()) return email
    return 'User account'
  }
  if (input.targetType) return humanizeKey(input.targetType)
  return 'Record'
}

function integrationChangeLine(input: AuditCopyInput): string | null {
  const change = input.changes?.isEnabled
  if (!change || typeof change.to !== 'boolean') return null
  const name = integrationName(input) ?? 'The service'
  return change.to ? `${name} was turned on.` : `${name} was turned off.`
}

function changeLines(input: AuditCopyInput): string[] {
  const integrationLine = integrationChangeLine(input)
  if (integrationLine) return [integrationLine]

  const lines: string[] = []
  const changes = input.changes ?? {}

  for (const [key, change] of Object.entries(changes)) {
    if (key === 'isEnabled') continue
    if (key === 'isActive') {
      lines.push(typeof change.to === 'boolean' && change.to
        ? 'The account was marked as active again.'
        : 'The account was marked as inactive.')
      continue
    }
    if (key === 'fullName') {
      lines.push(`Name changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'name') {
      lines.push(`Institution name changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'shortName') {
      lines.push(`Short name changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'contactEmail') {
      lines.push(`Contact email changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'timezone') {
      lines.push(`Timezone changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    if (key === 'locale') {
      lines.push(`Language changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
      continue
    }
    lines.push(`${humanizeKey(key)} changed from ${formatPlainValue(change.from)} to ${formatPlainValue(change.to)}.`)
  }

  return lines
}

function metadataLines(input: AuditCopyInput): string[] {
  const lines: string[] = []
  const meta = input.metadata ?? {}

  if (input.action === 'user.create') {
    if (typeof meta.email === 'string') lines.push(`New login email: ${meta.email}.`)
    if (typeof meta.role === 'string') lines.push(`Role assigned: ${displayRole(meta.role)}.`)
  }

  if (input.action === 'user.resetPassword') {
    lines.push('A new temporary password was generated for this account.')
  }

  if (input.action === 'user.revoke') {
    if (typeof meta.reason === 'string' && meta.reason.trim()) {
      lines.push(`Reason recorded: ${meta.reason}.`)
    } else {
      lines.push('Access was withdrawn and active sessions were ended.')
    }
  }

  if (input.action === 'user.restore') {
    lines.push('Access was restored so the person can sign in again.')
  }

  if (input.action === 'role.permissions') {
    const count = Array.isArray(meta.permissionKeys) ? meta.permissionKeys.length : null
    if (count != null) {
      lines.push(`${count} ${count === 1 ? 'permission is' : 'permissions are'} now enabled for this role.`)
    } else {
      lines.push('The permissions for this role were updated.')
    }
  }

  if (input.action === 'announcement.create') {
    if (typeof meta.title === 'string') lines.push(`Title: ${meta.title}.`)
    if (typeof meta.recipientCount === 'number') {
      lines.push(`Sent to ${meta.recipientCount} ${meta.recipientCount === 1 ? 'person' : 'people'}.`)
    }
  }

  if (input.action === 'settings.update' && !lines.length) {
    lines.push('Institution contact details or regional settings were updated.')
  }

  return lines
}

export function auditSummary(input: AuditCopyInput): string {
  const integrationLine = integrationChangeLine(input)
  if (integrationLine) return integrationLine

  const subject = subjectName(input)

  switch (input.action) {
    case 'user.create':
      return `Created account for ${subject}`
    case 'user.update':
      return `Updated ${subject}`
    case 'user.resetPassword':
      return `Reset password for ${subject}`
    case 'user.revoke':
      return `Revoked access for ${subject}`
    case 'user.restore':
      return `Restored access for ${subject}`
    case 'role.permissions':
      return `Updated permissions for ${subject}`
    case 'settings.update':
      return 'Updated institution settings'
    case 'announcement.create':
      return `Published announcement ${subject}`
    case 'integration.update':
      return integrationName(input) ? `Updated ${integrationName(input)}` : 'Updated connected service'
    default:
      return humanizeKey(input.action)
  }
}

/** @deprecated Use auditSummary for list labels. Kept for search filters. */
export function auditActionLabel(action: string): string {
  return auditSummary({ action })
}

export function buildAuditDetail(input: AuditCopyInput): AuditDetailView {
  const subject = subjectName(input)
  const actor = input.actorEmail ?? 'System'
  const role = input.actorRole ? displayRole(input.actorRole) : 'System'
  const when = input.createdAt ? new Date(input.createdAt).toLocaleString() : 'Unknown time'
  const whatHappened = [...changeLines(input), ...metadataLines(input)]

  return {
    headline: auditSummary(input),
    subheadline: `${actor} · ${role} · ${when}`,
    sections: [
      {
        title: 'Who did this',
        rows: [
          { label: 'Person', value: actor },
          { label: 'Role', value: role },
          { label: 'When', value: when },
        ],
      },
      {
        title: 'What changed',
        rows: [
          { label: 'Area', value: subject },
          {
            label: 'Details',
            value: whatHappened.length
              ? whatHappened.join('\n')
              : 'No extra details were recorded for this action.',
          },
        ],
      },
    ],
  }
}
