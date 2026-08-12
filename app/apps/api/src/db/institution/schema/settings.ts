import {
  boolean,
  index,
  inet,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { notificationChannelEnum } from './enums'
import { users } from './people'

/** Per-institution configuration, integrations and the audit trail. */

export const institutionSettings = pgTable(
  'institution_settings',
  {
    id: primaryKeyColumn(),
    /** Dotted key such as grading.scale or branding.primaryColour. */
    key: text('key').notNull(),
    value: jsonb('value').$type<unknown>().notNull(),
    /** Groups keys for the settings screen, e.g. Branding, Grading, Fees. */
    category: text('category').notNull().default('General'),
    description: text('description'),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('institution_settings_key_key').on(t.key)],
)

export const integrations = pgTable(
  'integrations',
  {
    id: primaryKeyColumn(),
    /** e.g. MTNMoMo, AirtelMoney, DPOPay, Pindo, Resend. */
    provider: text('provider').notNull(),
    displayName: text('display_name').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(false),
    /** Non-secret settings only. Credentials live in the secret store, never here. */
    config: jsonb('config').$type<Record<string, unknown>>(),
    /** Reference to the credential in the secret store, not the credential itself. */
    credentialRef: text('credential_ref'),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true, mode: 'string' }),
    lastStatus: text('last_status'),
    ...timestamps(),
  },
  (t) => [uniqueIndex('integrations_provider_key').on(t.provider)],
)

export const apiKeys = pgTable(
  'api_keys',
  {
    id: primaryKeyColumn(),
    name: text('name').notNull(),
    /** Only the hash is kept, so a leak of this table cannot be used to call the API. */
    keyHash: text('key_hash').notNull(),
    /** First few characters, shown in the UI so a key can be recognised. */
    keyPrefix: text('key_prefix').notNull(),
    scopes: text('scopes').array().notNull().default([]),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('api_keys_hash_key').on(t.keyHash),
    index('api_keys_prefix_idx').on(t.keyPrefix),
  ],
)

/**
 * The institution's audit trail.
 *
 * Append-only by policy: rows are never updated or deleted, because an audit
 * log that can be edited is not evidence of anything.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: primaryKeyColumn(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    /** Kept as text as well, so the entry survives the user being deleted. */
    actorEmail: text('actor_email'),
    actorRole: text('actor_role'),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    /** Before and after values for changed fields only. */
    changes: jsonb('changes').$type<Record<string, { from: unknown; to: unknown }>>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index('audit_logs_actor_idx').on(t.actorId, t.createdAt),
    index('audit_logs_target_idx').on(t.targetType, t.targetId),
    index('audit_logs_action_idx').on(t.action, t.createdAt),
  ],
)

export const notificationTemplates = pgTable(
  'notification_templates',
  {
    id: primaryKeyColumn(),
    /** e.g. fees.reminder, results.published. */
    key: text('key').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    locale: text('locale').notNull().default('en'),
    subject: text('subject'),
    /** Supports {{placeholders}} filled in when the message is sent. */
    body: text('body').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('notification_templates_key').on(t.key, t.channel, t.locale)],
)
