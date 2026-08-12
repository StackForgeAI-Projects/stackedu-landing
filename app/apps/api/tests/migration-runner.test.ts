import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { getPlatformDb } from '../src/db/connection'
import { migrateAllInstitutions } from '../src/db/migrate'
import { provisionInstitution } from '../src/db/provision'
import { institutionDatabases, institutions, migrationHistory } from '../src/db/platform/schema'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

/**
 * One database per institution means a migration is no longer a single event.
 * The runner is the tool that keeps every database on the same schema, so its
 * behaviour on both the happy path and on failure is worth proving.
 */
describe('migration runner', () => {
  let platform: TestPlatform
  const slugs = [uniqueSlug('mig1'), uniqueSlug('mig2'), uniqueSlug('mig3')]

  beforeAll(async () => {
    platform = await createTestPlatform()

    for (const [index, slug] of slugs.entries()) {
      await provisionInstitution({
        name: `Migration Test ${index + 1}`,
        slug,
        shortName: `MT${index + 1}`,
        contactEmail: `admin@mt${index + 1}.test`,
      })
    }
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('applies migrations across every institution and reports each one', async () => {
    const outcomes = await migrateAllInstitutions()

    expect(outcomes).toHaveLength(3)
    expect(outcomes.every((outcome) => outcome.succeeded)).toBe(true)
    expect(new Set(outcomes.map((outcome) => outcome.databaseName)).size).toBe(3)
  })

  it('is safe to run twice, because a deploy may be retried', async () => {
    const first = await migrateAllInstitutions()
    const second = await migrateAllInstitutions()

    expect(first.every((outcome) => outcome.succeeded)).toBe(true)
    expect(second.every((outcome) => outcome.succeeded)).toBe(true)
  })

  it('records progress in the platform database so a run can be resumed', async () => {
    await migrateAllInstitutions()

    const history = await getPlatformDb()
      .select({
        databaseName: migrationHistory.databaseName,
        succeeded: migrationHistory.succeeded,
      })
      .from(migrationHistory)

    expect(history).toHaveLength(3)
    expect(history.every((row) => row.succeeded)).toBe(true)
  })

  it('stops at the first failure instead of leaving the platform half-migrated', async () => {
    // The runner works through institutions in slug order, so breaking the
    // first one means the run must stop before reaching the other two.
    const firstSlug = [...slugs].sort()[0]!

    const [target] = await getPlatformDb()
      .select({ id: institutionDatabases.id })
      .from(institutionDatabases)
      .innerJoin(institutions, eq(institutions.id, institutionDatabases.institutionId))
      .where(eq(institutions.slug, firstSlug))

    const brokenUrl = new URL(platform.platformUrl)
    brokenUrl.pathname = '/stackedu_does_not_exist'

    await getPlatformDb()
      .update(institutionDatabases)
      .set({ connectionUrl: brokenUrl.toString() })
      .where(eq(institutionDatabases.id, target!.id))

    const outcomes = await migrateAllInstitutions()

    expect(outcomes).toHaveLength(1)
    expect(outcomes[0]?.succeeded).toBe(false)
    expect(outcomes[0]?.target).toBe(firstSlug)
  })
})

describe('migration runner with no institutions', () => {
  let platform: TestPlatform

  beforeAll(async () => {
    platform = await createTestPlatform()
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('succeeds quietly on a brand new platform', async () => {
    const outcomes = await migrateAllInstitutions()
    expect(outcomes).toEqual([])
  })
})

describe('platform database', () => {
  let platform: TestPlatform

  beforeAll(async () => {
    platform = await createTestPlatform()
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('holds no academic or financial tables', async () => {
    const sql = postgres(platform.platformUrl, { max: 1, onnotice: () => {} })
    try {
      const rows = await sql<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
      `
      const names = rows.map((row) => row.table_name)

      // The platform database is deliberately small: a problem here must not be
      // able to expose a student record.
      expect(names).not.toContain('students')
      expect(names).not.toContain('payments')
      expect(names).not.toContain('results')
      expect(names).toContain('institutions')
      expect(names).toContain('user_directory')
    } finally {
      await sql.end({ timeout: 5 })
    }
  })
})
