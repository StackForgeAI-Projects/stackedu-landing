import { eq } from 'drizzle-orm'
import type { ApplicationStatus } from '@stackedu/shared'
import { getPlatformDb } from '../db/connection'
import { institutions } from '../db/platform/schema'
import { env } from '../config/env'
import { createLogger } from './logger'
import { escapeHtml, sendEmail } from './email'

const log = createLogger('info', { service: 'stackedu-api', component: 'admissions-email' })

const DECISION_COPY: Record<
  Exclude<ApplicationStatus, 'Draft' | 'Submitted'>,
  { headline: string; body: string }
> = {
  UnderReview: {
    headline: 'Your application is under review',
    body: 'The admissions office is reviewing your application. We will email you again when there is an update.',
  },
  DocumentsRequested: {
    headline: 'Additional documents requested',
    body: 'The admissions office needs more documents before they can continue. Sign in to Track to see what is required and upload them.',
  },
  Accepted: {
    headline: 'Congratulations — your application was accepted',
    body: 'Your application has been accepted. Sign in to Track for next steps from the institution.',
  },
  Rejected: {
    headline: 'Update on your application',
    body: 'We are sorry to say your application was not accepted this time. Sign in to Track for any notes from the admissions office.',
  },
}

async function institutionName(institutionId: string): Promise<string> {
  const db = getPlatformDb()
  const [row] = await db
    .select({ name: institutions.name })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)
  return row?.name ?? 'StackEDU'
}

function trackUrl(): string {
  return `${env().WEB_APP_URL.replace(/\/$/, '')}/apply/track`
}

function layout(input: {
  title: string
  greeting: string
  paragraphs: string[]
  institution: string
}): { text: string; html: string } {
  const track = trackUrl()
  const text = [
    input.greeting,
    '',
    ...input.paragraphs,
    '',
    `Track your application: ${track}`,
    '',
    `— ${input.institution} (via StackEDU)`,
  ].join('\n')

  const htmlParagraphs = input.paragraphs
    .map((p) => `<p style="margin:0 0 12px;line-height:1.5;color:#1a1a1a">${escapeHtml(p)}</p>`)
    .join('')

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f6f7f8;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 24px">
    <h1 style="margin:0 0 16px;font-size:20px;color:#111">${escapeHtml(input.title)}</h1>
    <p style="margin:0 0 12px;line-height:1.5;color:#1a1a1a">${escapeHtml(input.greeting)}</p>
    ${htmlParagraphs}
    <p style="margin:20px 0 0">
      <a href="${escapeHtml(track)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
        Open Track
      </a>
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:#6b7280">— ${escapeHtml(input.institution)} (via StackEDU)</p>
  </div>
</body></html>`

  return { text, html }
}

/** Applicant email verification after registration. Never throws. */
export async function sendApplicantEmailVerification(input: {
  institutionId: string
  to: string
  fullName: string
  code: string
}): Promise<boolean> {
  try {
    const institution = await institutionName(input.institutionId)
    const digits = input.code.split('')
    const codeBoxes = digits
      .map(
        (digit) =>
          `<span style="display:inline-block;width:44px;height:52px;line-height:52px;margin:0 4px;border-radius:10px;background:#fff;border:1px solid #e5e7eb;font-size:24px;font-weight:700;color:#2563eb;text-align:center">${escapeHtml(digit)}</span>`,
      )
      .join('')

    const paragraphs = [
      'We sent you this verification code to confirm your email address and secure your account. Enter the code below to complete your registration.',
      'Enter this code on the verification page to continue your application.',
      'This code will expire in 15 minutes. If you did not request this verification, please ignore this email.',
    ]

    const content = layout({
      title: 'Verify your account',
      greeting: `Hello ${input.fullName},`,
      paragraphs: [
        paragraphs[0]!,
        `Verification code: ${input.code}`,
        paragraphs[1]!,
        paragraphs[2]!,
      ],
      institution,
    })

    const html = content.html.replace(
      `Verification code: ${input.code}`,
      `<div style="margin:20px 0;padding:16px;border-radius:12px;background:#f3f4f6;text-align:center">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.08em;color:#6b7280">VERIFICATION CODE</p>
        <div>${codeBoxes}</div>
      </div>`,
    )

    return await sendEmail({
      to: input.to,
      subject: `Verify your account — ${institution}`,
      institutionId: input.institutionId,
      text: content.text,
      html,
    })
  } catch (error) {
    log.error('Failed to send applicant verification email', {
      to: input.to,
      error,
    })
    return false
  }
}

/** Applicant notification after a successful submit. Never throws. */
export async function notifyApplicationSubmitted(input: {
  institutionId: string
  to: string
  fullName: string
  reference: string
  programmeName: string | null
}): Promise<void> {
  try {
    const institution = await institutionName(input.institutionId)
    const programmeLine = input.programmeName
      ? `Programme: ${input.programmeName}`
      : 'Your selected programme is on file.'

    const content = layout({
      title: 'Application received',
      greeting: `Hello ${input.fullName},`,
      paragraphs: [
        `We have received your application to ${institution}.`,
        `Application ID: ${input.reference}`,
        programmeLine,
        'Keep your Application ID safe — you will need it to sign in and track progress.',
      ],
      institution,
    })

    await sendEmail({
      to: input.to,
      subject: `Application received — ${input.reference}`,
      institutionId: input.institutionId,
      ...content,
    })
  } catch (error) {
    log.error('Failed to notify applicant of submission', {
      reference: input.reference,
      error,
    })
  }
}

/** Applicant notification after an academic decision / status update. Never throws. */
export async function notifyApplicationDecision(input: {
  institutionId: string
  to: string
  fullName: string
  reference: string
  decision: Exclude<ApplicationStatus, 'Draft' | 'Submitted'>
  comments?: string | null
}): Promise<void> {
  try {
    const institution = await institutionName(input.institutionId)
    const copy = DECISION_COPY[input.decision]
    const paragraphs = [
      copy.body,
      `Application ID: ${input.reference}`,
      `Status: ${input.decision}`,
    ]
    const trimmed = input.comments?.trim()
    if (trimmed) paragraphs.push(`Note from admissions: ${trimmed}`)

    const content = layout({
      title: copy.headline,
      greeting: `Hello ${input.fullName},`,
      paragraphs,
      institution,
    })

    await sendEmail({
      to: input.to,
      subject: `${copy.headline} — ${input.reference}`,
      institutionId: input.institutionId,
      ...content,
    })
  } catch (error) {
    log.error('Failed to notify applicant of decision', {
      reference: input.reference,
      decision: input.decision,
      error,
    })
  }
}
