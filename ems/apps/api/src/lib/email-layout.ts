import { eq } from 'drizzle-orm'
import { env } from '../config/env'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { escapeHtml } from './email'

/** Shown in email footers when ICT settings have not set location / website yet. */
const DEMO_LOCATION = 'KG 11 Ave, Nyarugenge, Kigali, Rwanda'
const DEMO_WEBSITE = 'https://sfu.ac.rw'

export interface InstitutionEmailBranding {
  name: string
  slug: string
  contactEmail: string
  location: string
  website: string
  logoUrl: string
}

export interface BrandedEmailInput {
  branding: InstitutionEmailBranding
  title: string
  greeting: string
  /** Shown immediately after the greeting — used for admissions notes on document requests. */
  leadNote?: string
  paragraphs: string[]
  /** Extra HTML inserted after paragraphs and before the CTA button. */
  bodyHtmlExtra?: string
  /** When false, the Track button is omitted (e.g. account provisioning mail). */
  showTrackButton?: boolean
  trackUrl?: string
}

function publicLogoUrl(slug: string, logoFileKey: string | null): string | null {
  if (!logoFileKey) return null
  return `${env().API_PUBLIC_URL.replace(/\/$/, '')}/public/institution/${slug}/logo`
}

function defaultLogoUrl(): string {
  return `${env().WEB_APP_URL.replace(/\/$/, '')}/stackedu-logo.png`
}

export async function getInstitutionEmailBranding(
  institutionId: string,
): Promise<InstitutionEmailBranding> {
  const [row] = await getPlatformDb()
    .select({
      name: institutions.name,
      slug: institutions.slug,
      contactEmail: institutions.contactEmail,
      website: institutions.website,
      location: institutions.location,
      logoFileKey: institutions.logoFileKey,
    })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  const slug = row?.slug ?? 'sfu'
  const logoFromStorage = publicLogoUrl(slug, row?.logoFileKey ?? null)

  return {
    name: row?.name ?? 'StackForgeAI University',
    slug,
    contactEmail: row?.contactEmail ?? 'admissions@stackedu.rw',
    location: row?.location?.trim() || DEMO_LOCATION,
    website: row?.website?.trim() || DEMO_WEBSITE,
    logoUrl: logoFromStorage ?? defaultLogoUrl(),
  }
}

function footerLines(branding: InstitutionEmailBranding): string[] {
  return [
    branding.name,
    branding.location,
    `Email: ${branding.contactEmail}`,
    `Website: ${branding.website}`,
    '',
    'Powered by StackEDU',
  ]
}

export function buildBrandedEmail(input: BrandedEmailInput): { text: string; html: string } {
  const track = input.trackUrl ?? `${env().WEB_APP_URL.replace(/\/$/, '')}/apply/track`
  const showTrack = input.showTrackButton !== false

  const text = [
    input.greeting,
    '',
    ...(input.leadNote ? [input.leadNote, ''] : []),
    ...input.paragraphs,
    '',
    ...(showTrack ? [`Track your application: ${track}`, ''] : []),
    ...footerLines(input.branding),
  ].join('\n')

  const htmlParagraphs = input.paragraphs
    .map((p) => `<p style="margin:0 0 12px;line-height:1.5;color:#1a1a1a">${escapeHtml(p)}</p>`)
    .join('')

  const trackButton = showTrack
    ? `<p style="margin:20px 0 0">
        <a href="${escapeHtml(track)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
          Open Track
        </a>
      </p>`
    : ''

  const footerHtml = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151">${escapeHtml(input.branding.name)}</p>
    <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#6b7280">${escapeHtml(input.branding.location)}</p>
    <p style="margin:0 0 4px;font-size:12px;color:#6b7280">
      Email: <a href="mailto:${escapeHtml(input.branding.contactEmail)}" style="color:#2563eb;text-decoration:none">${escapeHtml(input.branding.contactEmail)}</a>
    </p>
    <p style="margin:0 0 12px;font-size:12px;color:#6b7280">
      Website: <a href="${escapeHtml(input.branding.website)}" style="color:#2563eb;text-decoration:none">${escapeHtml(input.branding.website.replace(/^https?:\/\//, ''))}</a>
    </p>
    <p style="margin:0;font-size:11px;color:#9ca3af">Powered by StackEDU</p>`

  const leadNoteHtml = input.leadNote
    ? `<div style="margin:0 0 16px;padding:16px;border-radius:12px;background:#fef3c7;border:1px solid #f59e0b">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;color:#92400e">MESSAGE FROM ADMISSIONS</p>
        <p style="margin:0;line-height:1.6;color:#1a1a1a;font-size:15px">${escapeHtml(input.leadNote)}</p>
      </div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f6f7f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
          <tr>
            <td style="padding:20px 24px;background:#111827;border-bottom:3px solid #16a34a">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle">
                    <img src="${escapeHtml(input.branding.logoUrl)}" alt="${escapeHtml(input.branding.name)}" width="44" height="44" style="display:block;border-radius:8px;object-fit:contain;background:#ffffff" />
                  </td>
                  <td style="vertical-align:middle">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.2">${escapeHtml(input.branding.name)}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#d1d5db">Admissions Office</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px">
              <h1 style="margin:0 0 16px;font-size:20px;color:#111">${escapeHtml(input.title)}</h1>
              <p style="margin:0 0 12px;line-height:1.5;color:#1a1a1a">${escapeHtml(input.greeting)}</p>
              ${leadNoteHtml}
              ${htmlParagraphs}
              ${input.bodyHtmlExtra ?? ''}
              ${trackButton}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { text, html }
}
