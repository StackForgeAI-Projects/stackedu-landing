import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { getInstitutionDb, getPlatformDb } from '../src/db/connection'
import { deprovisionInstitution, provisionInstitution } from '../src/db/provision'
import { permissionsForRole } from '../src/db/seed-defaults'
import { institutionDatabases, institutions } from '../src/db/platform/schema'
import { adminConnectionUrl } from '../src/db/naming'
import { AppError } from '../src/lib/errors'
import {
  createTestPlatform,
  TEST_SERVER_URL,
  uniqueSlug,
  type TestPlatform,
} from './helpers/test-database'

async function databaseExists(name: string): Promise<boolean> {
  const admin = postgres(adminConnectionUrl(TEST_SERVER_URL), { max: 1, onnotice: () => {} })
  try {
    const rows = await admin`SELECT 1 FROM pg_database WHERE datname = ${name}`
    return rows.length > 0
  } finally {
    await admin.end({ timeout: 5 })
  }
}

describe('institution provisioning', () => {
  let platform: TestPlatform

  beforeAll(async () => {
    platform = await createTestPlatform()
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('creates the database, applies the schema and marks the institution active', async () => {
    const slug = uniqueSlug('prov')
    const result = await provisionInstitution({
      name: 'Provisioning Test University',
      slug,
      shortName: 'PTU',
      contactEmail: 'admin@ptu.test',
    })

    expect(result.databaseName).toBe(`stackedu_inst_${slug}`)
    expect(await databaseExists(result.databaseName)).toBe(true)

    const [row] = await getPlatformDb()
      .select({ status: institutions.status })
      .from(institutions)
      .where(eq(institutions.id, result.institutionId))

    expect(row?.status).toBe('Active')
  })

  it('seeds the six roles with their default permissions', async () => {
    const result = await provisionInstitution({
      name: 'Seeded University',
      slug: uniqueSlug('seed'),
      shortName: 'SU',
      contactEmail: 'admin@su.test',
    })

    const db = await getInstitutionDb(result.institutionId)

    const bursar = await permissionsForRole(db, 'Bursar')
    const student = await permissionsForRole(db, 'Student')
    const lecturer = await permissionsForRole(db, 'Lecturer')

    expect(bursar).toContain('payments.record')
    expect(bursar).toContain('refunds.approve')

    expect(lecturer).toContain('attendance.record')
    expect(lecturer).toContain('grades.write')
    expect(lecturer).toContain('results.submit')
    expect(lecturer).toContain('timetable.write')
    expect(lecturer).not.toContain('results.publish')

    // A student must never be able to touch money or publish results.
    expect(student).not.toContain('payments.record')
    expect(student).not.toContain('results.publish')
    expect(student).toContain('library.read')
  })

  it('enables pgvector, which semantic library search depends on', async () => {
    const result = await provisionInstitution({
      name: 'Vector University',
      slug: uniqueSlug('vec'),
      shortName: 'VU',
      contactEmail: 'admin@vu.test',
    })

    const sql = postgres(result.connectionUrl, { max: 1, onnotice: () => {} })
    try {
      const rows = await sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`
      expect(rows).toHaveLength(1)
    } finally {
      await sql.end({ timeout: 5 })
    }
  })

  it('refuses a duplicate slug rather than creating a second database', async () => {
    const slug = uniqueSlug('dup')
    await provisionInstitution({
      name: 'First University',
      slug,
      shortName: 'FU',
      contactEmail: 'admin@fu.test',
    })

    await expect(
      provisionInstitution({
        name: 'Second University',
        slug,
        shortName: 'SU2',
        contactEmail: 'admin@su2.test',
      }),
    ).rejects.toThrow(AppError)
  })

  it('rejects a slug that could be used to inject SQL into CREATE DATABASE', async () => {
    await expect(
      provisionInstitution({
        name: 'Injection Attempt',
        slug: 'evil"; DROP DATABASE postgres; --',
        shortName: 'EVIL',
        contactEmail: 'admin@evil.test',
      }),
    ).rejects.toThrow()

    // The server is still standing.
    expect(await databaseExists('postgres')).toBe(true)
  })

  it('leaves nothing behind when provisioning fails part-way', async () => {
    const slug = uniqueSlug('rollback')
    const databaseName = `stackedu_inst_${slug}`

    // Create the database first so provisioning hits a conflict after it has
    // already written the registry row.
    const admin = postgres(adminConnectionUrl(TEST_SERVER_URL), { max: 1, onnotice: () => {} })
    await admin.unsafe(`CREATE DATABASE "${databaseName}"`)
    await admin.end({ timeout: 5 })

    await expect(
      provisionInstitution({
        name: 'Rollback University',
        slug,
        shortName: 'RU',
        contactEmail: 'admin@ru.test',
      }),
    ).rejects.toThrow()

    // A half-provisioned institution would appear in the registry while being
    // unusable, so the registry must be clean.
    const rows = await getPlatformDb()
      .select({ id: institutions.id })
      .from(institutions)
      .where(eq(institutions.slug, slug))

    expect(rows).toHaveLength(0)
  })

  it('removes the database and registry entries on deprovision', async () => {
    const result = await provisionInstitution({
      name: 'Temporary College',
      slug: uniqueSlug('temp'),
      shortName: 'TC',
      contactEmail: 'admin@tc.test',
    })

    await deprovisionInstitution(result.institutionId)

    expect(await databaseExists(result.databaseName)).toBe(false)

    const registry = await getPlatformDb()
      .select({ id: institutionDatabases.id })
      .from(institutionDatabases)
      .where(eq(institutionDatabases.institutionId, result.institutionId))

    expect(registry).toHaveLength(0)
  })
})
