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
import { userRoleEnum } from './enums'

/**
 * People and access.
 *
 * These tables live inside an institution's own database, so there is no
 * institution_id column — every row here belongs to this institution by
 * definition.
 */

export const users = pgTable(
  'users',
  {
    id: primaryKeyColumn(),
    email: text('email').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'string' }),
    phone: text('phone'),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true, mode: 'string' }),
    fullName: text('full_name').notNull(),
    avatarKey: text('avatar_key'),
    role: userRoleEnum('role').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    /** Set when the ICT manager revokes access; see accessRevocations for why. */
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true, mode: 'string' }),
    passwordHash: text('password_hash'),
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    twoFactorSecret: text('two_factor_secret'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'string' }),
    preferredLocale: text('preferred_locale').notNull().default('en'),
    /** Per-user notification channel toggles keyed by preference id. */
    notificationPreferences: jsonb('notification_preferences').$type<
      Record<string, { email: boolean; sms: boolean; inapp: boolean }>
    >(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    index('users_role_idx').on(t.role),
    index('users_active_idx').on(t.isActive),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: primaryKeyColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('sessions_token_key').on(t.token),
    index('sessions_user_idx').on(t.userId),
    index('sessions_expires_idx').on(t.expiresAt),
  ],
)

/** Third-party sign-in links, kept separate so a user can have several. */
export const accounts = pgTable(
  'accounts',
  {
    id: primaryKeyColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'string',
    }),
    scope: text('scope'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('accounts_provider_account_key').on(t.providerId, t.accountId),
    index('accounts_user_idx').on(t.userId),
  ],
)

/** One-time codes for email verification, password reset and login OTP. */
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: primaryKeyColumn(),
    identifier: text('identifier').notNull(),
    tokenHash: text('token_hash').notNull(),
    purpose: text('purpose').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamps().createdAt,
  },
  (t) => [
    index('verification_tokens_identifier_idx').on(t.identifier, t.purpose),
    uniqueIndex('verification_tokens_hash_key').on(t.tokenHash),
  ],
)

/**
 * Roles are seeded to match the six portals but remain editable, because
 * institutions title the same job differently.
 */
export const roles = pgTable(
  'roles',
  {
    id: primaryKeyColumn(),
    key: userRoleEnum('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    /** System roles cannot be deleted, only renamed. */
    isSystem: boolean('is_system').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('roles_key_key').on(t.key)],
)

export const permissions = pgTable(
  'permissions',
  {
    id: primaryKeyColumn(),
    /** Dotted identifier such as results.publish. */
    key: text('key').notNull(),
    module: text('module').notNull(),
    description: text('description'),
    createdAt: timestamps().createdAt,
  },
  (t) => [uniqueIndex('permissions_key_key').on(t.key), index('permissions_module_idx').on(t.module)],
)

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: primaryKeyColumn(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamps().createdAt,
  },
  (t) => [uniqueIndex('role_permissions_key').on(t.roleId, t.permissionId)],
)

/**
 * A revocation is a deliberate, reviewable record rather than a deleted row,
 * because withdrawing someone's access is an event an auditor will ask about.
 */
export const accessRevocations = pgTable(
  'access_revocations',
  {
    id: primaryKeyColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason').notNull(),
    effectiveAt: timestamp('effective_at', { withTimezone: true, mode: 'string' }).notNull(),
    restoredAt: timestamp('restored_at', { withTimezone: true, mode: 'string' }),
    restoredBy: uuid('restored_by').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ...timestamps(),
  },
  (t) => [index('access_revocations_user_idx').on(t.userId)],
)
