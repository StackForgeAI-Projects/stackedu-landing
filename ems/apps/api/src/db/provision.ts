import { createInstitutionSchema } from '@stackedu/shared'
import type { CreateInstitutionInput } from '@stackedu/shared'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { env } from '../config/env'
import { conflict, validationFailed } from '../lib/errors'
import type { Logger } from '../lib/logger'
import {
  connectToInstitutionUrl,
  getPlatformDb,
  invalidateInstitutionConnection,
} from './connection'
import { migrateInstitutionUrl } from './migrate'
import {
  adminConnectionUrl,
  assertSafeDatabaseName,
  institutionDatabaseName,
  withDatabaseName,
} from './naming'
import { institutionDatabases, institutions } from './platform/schema'
import { seedInstitutionDefaults } from './seed-defaults'

export interface ProvisionResult {
  institutionId: string
  slug: string
  databaseName: string
  connectionUrl: string
}

async function databaseExists(admin: postgres.Sql, databaseName: string): Promise<boolean> {
  const rows = await admin`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`
  return rows.length > 0
}

/**
 * Creates a brand new institution: its registry entry, its own database, the
 * full schema, and the default roles and permissions.
 *
 * Adding an institution is a script rather than a manual setup task, because a
 * process performed by hand once or twice a year is a process that will be
 * performed inconsistently.
 */
export async function provisionInstitution(
  input: CreateInstitutionInput,
  options?: { logger?: Logger },
): Promise<ProvisionResult> {
  const logger = options?.logger
  const parsed = createInstitutionSchema.safeParse(input)

  if (!parsed.success) {
    const details: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'input'
      ;(details[key] ??= []).push(issue.message)
    }
    throw validationFailed(details)
  }

  const data = parsed.data
  const platform = getPlatformDb()
  const databaseName = assertSafeDatabaseName(institutionDatabaseName(data.slug))

  const [existing] = await platform
    .select({ id: institutions.id })
    .from(institutions)
    .where(eq(institutions.slug, data.slug))
    .limit(1)

  if (existing) throw conflict(`An institution with the slug "${data.slug}" already exists.`)

  const baseUrl = env().ADMIN_DATABASE_URL ?? env().PLATFORM_DATABASE_URL
  const admin = postgres(adminConnectionUrl(baseUrl), { max: 1, onnotice: () => {} })
  const connectionUrl = withDatabaseName(baseUrl, databaseName)

  let institutionId: string | undefined
  let databaseCreated = false

  try {
    if (await databaseExists(admin, databaseName)) {
      throw conflict(`Database "${databaseName}" already exists. Choose a different slug.`)
    }

    const [created] = await platform
      .insert(institutions)
      .values({
        name: data.name,
        slug: data.slug,
        shortName: data.shortName,
        contactEmail: data.contactEmail,
        timezone: data.timezone,
        locale: data.locale,
        status: 'Provisioning',
      })
      .returning({ id: institutions.id })

    institutionId = created?.id
    if (!institutionId) throw new Error('Failed to create the institution registry entry')

    // CREATE DATABASE cannot run inside a transaction, and identifiers cannot be
    // parameterised — hence the validation above before this interpolation.
    await admin.unsafe(`CREATE DATABASE "${databaseName}"`)
    databaseCreated = true
    logger?.info('Institution database created', { databaseName })

    await enablePgvector(connectionUrl)
    await migrateInstitutionUrl(connectionUrl)
    logger?.info('Institution schema applied', { databaseName })

    const { db, sql } = connectToInstitutionUrl(connectionUrl)
    try {
      await seedInstitutionDefaults(db)
    } finally {
      await sql.end({ timeout: 5 })
    }

    await platform.insert(institutionDatabases).values({
      institutionId,
      databaseName,
      connectionUrl,
      schemaVersion: 'latest',
    })

    await platform
      .update(institutions)
      .set({ status: 'Active' })
      .where(eq(institutions.id, institutionId))

    invalidateInstitutionConnection(institutionId)
    logger?.info('Institution ready', { slug: data.slug, databaseName })

    return { institutionId, slug: data.slug, databaseName, connectionUrl }
  } catch (error) {
    // A half-provisioned institution is worse than none: it would appear in the
    // registry while being unusable. Undo whatever succeeded before failing.
    if (institutionId) {
      await platform.delete(institutionDatabases).where(
        eq(institutionDatabases.institutionId, institutionId),
      ).catch(() => {})
      await platform.delete(institutions).where(eq(institutions.id, institutionId)).catch(() => {})
    }
    if (databaseCreated) {
      await admin.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`).catch(() => {})
    }
    logger?.error('Provisioning failed and was rolled back', { slug: data.slug, error })
    throw error
  } finally {
    await admin.end({ timeout: 5 })
  }
}

/** pgvector backs semantic search over library resources. */
async function enablePgvector(connectionUrl: string): Promise<void> {
  const sql = postgres(connectionUrl, { max: 1, onnotice: () => {} })
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`
  } finally {
    await sql.end({ timeout: 5 })
  }
}

/** Removes an institution and its database. Intended for tests and undoing a mistake. */
export async function deprovisionInstitution(institutionId: string): Promise<void> {
  const platform = getPlatformDb()

  const [row] = await platform
    .select({ databaseName: institutionDatabases.databaseName })
    .from(institutionDatabases)
    .where(eq(institutionDatabases.institutionId, institutionId))
    .limit(1)

  invalidateInstitutionConnection(institutionId)

  await platform.delete(institutionDatabases).where(
    eq(institutionDatabases.institutionId, institutionId),
  )
  await platform.delete(institutions).where(eq(institutions.id, institutionId))

  if (!row) return

  const baseUrl = env().ADMIN_DATABASE_URL ?? env().PLATFORM_DATABASE_URL
  const admin = postgres(adminConnectionUrl(baseUrl), { max: 1, onnotice: () => {} })
  try {
    const name = assertSafeDatabaseName(row.databaseName)
    // Existing sessions would otherwise block the drop.
    await admin.unsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${name}' AND pid <> pg_backend_pid()`,
    )
    await admin.unsafe(`DROP DATABASE IF EXISTS "${name}"`)
  } finally {
    await admin.end({ timeout: 5 })
  }
}
