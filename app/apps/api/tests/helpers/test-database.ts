import { randomBytes } from 'node:crypto'
import postgres from 'postgres'
import { resetEnvCache } from '../../src/config/env'
import { closeAllConnections } from '../../src/db/connection'
import { migratePlatform } from '../../src/db/migrate'
import { adminConnectionUrl, withDatabaseName } from '../../src/db/naming'

/**
 * Tests run against a real PostgreSQL rather than a mock.
 *
 * The whole point of the tenancy design is how it behaves against an actual
 * database — separate databases, real foreign keys, real enum types. A mock
 * would happily agree with a broken implementation.
 */

export const TEST_SERVER_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://stackedu:stackedu@localhost:5433/postgres'

export interface TestPlatform {
  platformUrl: string
  platformDatabaseName: string
  cleanup: () => Promise<void>
}

function uniqueName(prefix: string): string {
  return `${prefix}${randomBytes(5).toString('hex')}`
}

/**
 * Gives a test file its own platform database, so files cannot interfere with
 * each other or with the developer's local seed data.
 */
export async function createTestPlatform(): Promise<TestPlatform> {
  const platformDatabaseName = uniqueName('stackedu_test_')
  const admin = postgres(adminConnectionUrl(TEST_SERVER_URL), { max: 1, onnotice: () => {} })

  await admin.unsafe(`CREATE DATABASE "${platformDatabaseName}"`)
  await admin.end({ timeout: 5 })

  const platformUrl = withDatabaseName(TEST_SERVER_URL, platformDatabaseName)

  process.env.PLATFORM_DATABASE_URL = platformUrl
  process.env.ADMIN_DATABASE_URL = platformUrl
  process.env.NODE_ENV = 'test'
  resetEnvCache()

  const outcome = await migratePlatform()
  if (!outcome.succeeded) {
    throw new Error(`Test platform migration failed: ${outcome.error}`)
  }

  return {
    platformUrl,
    platformDatabaseName,
    cleanup: () => dropTestPlatform(platformDatabaseName),
  }
}

/** Drops the test platform database and every institution database it created. */
async function dropTestPlatform(platformDatabaseName: string): Promise<void> {
  await closeAllConnections()

  const admin = postgres(adminConnectionUrl(TEST_SERVER_URL), { max: 1, onnotice: () => {} })
  try {
    const rows = await admin<{ datname: string }[]>`
      SELECT datname FROM pg_database
      WHERE datname = ${platformDatabaseName}
         OR datname LIKE ${`stackedu_inst_${testSlugPrefix()}%`}
    `

    for (const row of rows) {
      await admin.unsafe(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname = '${row.datname}' AND pid <> pg_backend_pid()`,
      )
      await admin.unsafe(`DROP DATABASE IF EXISTS "${row.datname}"`)
    }
  } finally {
    await admin.end({ timeout: 5 })
  }
}

/**
 * Institution slugs created by tests all share this prefix so cleanup can find
 * them without risking a developer's real local databases.
 */
export function testSlugPrefix(): string {
  return 'zz'
}

export function uniqueSlug(label = 'inst'): string {
  return `${testSlugPrefix()}${label}${randomBytes(4).toString('hex')}`.toLowerCase()
}
