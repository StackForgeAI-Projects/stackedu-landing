import { eq } from 'drizzle-orm'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { notFound } from '../lib/errors'

/**
 * Which institution a public request belongs to.
 *
 * The admissions pages are open to people who have no account yet, so there is
 * no session to read the institution from. In production each institution has
 * its own subdomain — apply.kigali.stackedu.rw — and the host name answers the
 * question. In development there is one institution and no subdomain, so we
 * fall back to it rather than forcing every local request to carry a header.
 */
export async function resolvePublicInstitution(host: string | undefined): Promise<{
  id: string
  name: string
  shortName: string
  slug: string
}> {
  const db = getPlatformDb()
  const slug = host?.split(':')[0]?.split('.')[0]?.toLowerCase()

  if (slug) {
    const [bySlug] = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        shortName: institutions.shortName,
        slug: institutions.slug,
      })
      .from(institutions)
      .where(eq(institutions.slug, slug))
      .limit(1)

    if (bySlug) return bySlug
  }

  const all = await db
    .select({
      id: institutions.id,
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
    })
    .from(institutions)
    .limit(2)

  if (all.length === 1 && all[0]) return all[0]

  throw notFound('The institution')
}
