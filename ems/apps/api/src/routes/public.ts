import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { PublicInstitutionBranding } from '@stackedu/shared'
import { env } from '../config/env'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { notFound } from '../lib/errors'
import { createDownloadUrl, openInstitutionLogo } from '../lib/storage'
import type { RequestVariables } from '../middleware/request-context'

export const publicRoutes = new Hono<{ Variables: RequestVariables }>()

function publicLogoUrl(slug: string, logoFileKey: string | null): string | null {
  if (!logoFileKey) return null
  return `${env().API_PUBLIC_URL.replace(/\/$/, '')}/public/institution/${slug}/logo`
}

function mapPublicBranding(row: {
  name: string
  shortName: string
  slug: string
  website: string | null
  location: string | null
  logoFileKey: string | null
}): PublicInstitutionBranding {
  return {
    name: row.name,
    shortName: row.shortName,
    slug: row.slug,
    website: row.website,
    location: row.location,
    logoUrl: publicLogoUrl(row.slug, row.logoFileKey),
  }
}

/** Public institution branding for login, apply, and receipts before sign-in. */
publicRoutes.get('/public/institution/:slug', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase()
  const [row] = await getPlatformDb()
    .select({
      name: institutions.name,
      shortName: institutions.shortName,
      slug: institutions.slug,
      website: institutions.website,
      location: institutions.location,
      logoFileKey: institutions.logoFileKey,
    })
    .from(institutions)
    .where(eq(institutions.slug, slug))
    .limit(1)

  if (!row || row.slug !== slug) throw notFound('That institution')

  return c.json(mapPublicBranding(row))
})

publicRoutes.get('/public/institution/:slug/logo', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase()
  const [row] = await getPlatformDb()
    .select({ logoFileKey: institutions.logoFileKey, slug: institutions.slug })
    .from(institutions)
    .where(eq(institutions.slug, slug))
    .limit(1)

  if (!row?.logoFileKey || row.slug !== slug) throw notFound('That logo')

  if (env().STORAGE_DRIVER === 'r2') {
    const { url } = await createDownloadUrl(row.logoFileKey)
    return c.redirect(url, 302)
  }

  const { stream, mimeType } = openInstitutionLogo(row.logoFileKey)
  c.header('Content-Type', mimeType)
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(stream as unknown as ReadableStream)
})
