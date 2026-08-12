import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  getInstitutionDb,
  getPlatformDb,
  invalidateInstitutionConnection,
  openInstitutionPoolCount,
} from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { institutions } from '../src/db/platform/schema'
import { users } from '../src/db/institution/schema/people'
import { AppError } from '../src/lib/errors'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('connection manager', () => {
  let platform: TestPlatform
  let institutionId: string

  beforeAll(async () => {
    platform = await createTestPlatform()
    const result = await provisionInstitution({
      name: 'Pool Test University',
      slug: uniqueSlug('pool'),
      shortName: 'PTU',
      contactEmail: 'admin@pool.test',
    })
    institutionId = result.institutionId
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('reuses one pool per institution rather than connecting per request', async () => {
    const before = openInstitutionPoolCount()

    // Ten "requests" for the same institution.
    await Promise.all(Array.from({ length: 10 }, () => getInstitutionDb(institutionId)))

    expect(openInstitutionPoolCount()).toBe(before + 1)
  })

  it('returns a working handle that can read and write', async () => {
    const db = await getInstitutionDb(institutionId)

    await db.insert(users).values({
      email: 'pool@example.test',
      fullName: 'Pool Person',
      role: 'ICTManager',
    })

    const rows = await db.select().from(users).where(eq(users.email, 'pool@example.test'))
    expect(rows).toHaveLength(1)
  })

  it('drops the cached pool when a connection is invalidated', async () => {
    await getInstitutionDb(institutionId)
    const before = openInstitutionPoolCount()
    expect(before).toBeGreaterThan(0)

    invalidateInstitutionConnection(institutionId)

    expect(openInstitutionPoolCount()).toBe(before - 1)
  })

  it('refuses to connect to an institution that does not exist', async () => {
    await expect(
      getInstitutionDb('00000000-0000-4000-8000-000000000000'),
    ).rejects.toThrow(AppError)
  })

  it('refuses to serve a suspended institution', async () => {
    await getPlatformDb()
      .update(institutions)
      .set({ status: 'Suspended' })
      .where(eq(institutions.id, institutionId))

    invalidateInstitutionConnection(institutionId)

    await expect(getInstitutionDb(institutionId)).rejects.toThrow(/not currently active/i)

    await getPlatformDb()
      .update(institutions)
      .set({ status: 'Active' })
      .where(eq(institutions.id, institutionId))
    invalidateInstitutionConnection(institutionId)
  })
})
