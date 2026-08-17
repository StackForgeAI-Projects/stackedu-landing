import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { notFound } from '../lib/errors'
import type { RequestVariables } from '../middleware/request-context'

export const publicRoutes = new Hono<{ Variables: RequestVariables }>()

/** Public institution branding for login, apply, and receipts before sign-in. */
publicRoutes.get('/public/institution/:slug', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase()
  const [row] = await getPlatformDb()
    .select({
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
    })
    .from(institutions)
    .where(eq(institutions.slug, slug))
    .limit(1)

  if (!row || row.slug !== slug) throw notFound('That institution')

  return c.json(row)
})
