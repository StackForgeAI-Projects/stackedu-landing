import type { ApplicationStatus } from '@stackedu/shared'
import { createLogger } from './logger'
import { escapeHtml, sendEmail } from './email'
import { buildBrandedEmail, getInstitutionEmailBranding } from './email-layout'

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

function layout(input: {
  branding: Awaited<ReturnType<typeof getInstitutionEmailBranding>>
  title: string
  greeting: string
  paragraphs: string[]
  bodyHtmlExtra?: string
}): { text: string; html: string } {
  return buildBrandedEmail({
    branding: input.branding,
    title: input.title,
    greeting: input.greeting,
    paragraphs: input.paragraphs,
    bodyHtmlExtra: input.bodyHtmlExtra,
  })
}

/** Applicant email verification after registration. Never throws. */
export async function sendApplicantEmailVerification(input: {
  institutionId: string
  to: string
  fullName: string
  code: string
}): Promise<boolean> {
  try {
    const branding = await getInstitutionEmailBranding(input.institutionId)
    const digits = input.code.split('')
    const codeBoxes = digits
      .map(
        (digit) =>
          `<span style="display:inline-block;width:44px;height:52px;line-height:52px;margin:0 4px;border-radius:10px;background:#fff;border:1px solid #e5e7eb;font-size:24px;font-weight:700;color:#2563eb;text-align:center">${escapeHtml(digit)}</span>`,
      )
      .join('')

    const content = layout({
      branding,
      title: 'Verify your account',
      greeting: `Hello ${input.fullName},`,
      paragraphs: [
        'We sent you this verification code to confirm your email address and secure your account. Enter the code below to complete your registration.',
        'Enter this code on the verification page to continue your application.',
        'This code will expire in 15 minutes. If you did not request this verification, please ignore this email.',
      ],
      bodyHtmlExtra: `<div style="margin:20px 0;padding:16px;border-radius:12px;background:#f3f4f6;text-align:center">
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.08em;color:#6b7280">VERIFICATION CODE</p>
        <div>${codeBoxes}</div>
      </div>`,
    })

    return await sendEmail({
      to: input.to,
      subject: `Verify your account — ${branding.name}`,
      institutionId: input.institutionId,
      text: content.text,
      html: content.html,
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
    const branding = await getInstitutionEmailBranding(input.institutionId)
    const programmeLine = input.programmeName
      ? `Programme: ${input.programmeName}`
      : 'Your selected programme is on file.'

    const content = layout({
      branding,
      title: 'Application received',
      greeting: `Hello ${input.fullName},`,
      paragraphs: [
        `We have received your application to ${branding.name}.`,
        `Application ID: ${input.reference}`,
        programmeLine,
        'Keep your Application ID safe — you will need it to sign in and track progress.',
      ],
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
    const branding = await getInstitutionEmailBranding(input.institutionId)
    const copy = DECISION_COPY[input.decision]
    const paragraphs = [
      copy.body,
      `Application ID: ${input.reference}`,
      `Status: ${input.decision}`,
    ]
    const trimmed = input.comments?.trim()
    if (trimmed) paragraphs.push(`Note from admissions: ${trimmed}`)

    const content = layout({
      branding,
      title: copy.headline,
      greeting: `Hello ${input.fullName},`,
      paragraphs,
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
