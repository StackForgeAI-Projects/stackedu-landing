import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getInstitutionDb, getPlatformDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { users } from '../src/db/institution/schema/people'
import { institutionDatabases } from '../src/db/platform/schema'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

/**
 * The isolation guarantee.
 *
 * Everything in the architecture rests on one claim: a query run for one
 * institution cannot reach another institution's data. These tests prove it
 * against real databases rather than assuming it.
 */
describe('tenant isolation', () => {
  let platform: TestPlatform
  let alphaId: string
  let betaId: string

  beforeAll(async () => {
    platform = await createTestPlatform()

    const alpha = await provisionInstitution({
      name: 'Alpha University',
      slug: uniqueSlug('alpha'),
      shortName: 'ALPHA',
      contactEmail: 'registrar@alpha.test',
    })
    const beta = await provisionInstitution({
      name: 'Beta College',
      slug: uniqueSlug('beta'),
      shortName: 'BETA',
      contactEmail: 'registrar@beta.test',
    })

    alphaId = alpha.institutionId
    betaId = beta.institutionId
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('gives each institution a physically separate database', async () => {
    const rows = await getPlatformDb()
      .select({ databaseName: institutionDatabases.databaseName })
      .from(institutionDatabases)

    const names = rows.map((row) => row.databaseName)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toHaveLength(2)
  })

  it('does not expose one institution\u2019s users to the other', async () => {
    const alphaDb = await getInstitutionDb(alphaId)
    const betaDb = await getInstitutionDb(betaId)

    await alphaDb.insert(users).values({
      email: 'shared@example.test',
      fullName: 'Alpha Person',
      role: 'Student',
    })

    const alphaUsers = await alphaDb.select().from(users)
    const betaUsers = await betaDb.select().from(users)

    expect(alphaUsers).toHaveLength(1)
    expect(alphaUsers[0]?.fullName).toBe('Alpha Person')

    // The row is not merely filtered out — it does not exist in this database.
    expect(betaUsers).toHaveLength(0)
  })

  it('allows the same email address to exist in two institutions independently', async () => {
    const alphaDb = await getInstitutionDb(alphaId)
    const betaDb = await getInstitutionDb(betaId)

    // A lecturer teaching at two institutions is a real situation. A shared
    // users table with a unique email would have made this impossible.
    await betaDb.insert(users).values({
      email: 'shared@example.test',
      fullName: 'Beta Person',
      role: 'Lecturer',
    })

    const [fromAlpha] = await alphaDb
      .select()
      .from(users)
      .where(eq(users.email, 'shared@example.test'))
    const [fromBeta] = await betaDb
      .select()
      .from(users)
      .where(eq(users.email, 'shared@example.test'))

    expect(fromAlpha?.fullName).toBe('Alpha Person')
    expect(fromBeta?.fullName).toBe('Beta Person')
    expect(fromAlpha?.id).not.toBe(fromBeta?.id)
  })

  it('keeps deletions confined to the institution they were made in', async () => {
    const alphaDb = await getInstitutionDb(alphaId)
    const betaDb = await getInstitutionDb(betaId)

    await alphaDb.delete(users)

    expect(await alphaDb.select().from(users)).toHaveLength(0)
    // Beta is untouched — this is the "restore one institution" property that
    // motivated separate databases in the first place.
    expect(await betaDb.select().from(users)).toHaveLength(1)
  })
})
