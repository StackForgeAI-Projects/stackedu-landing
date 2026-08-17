import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { bodyLimit } from 'hono/body-limit'
import {
  confirmDocumentSchema,
  initiatePaymentSchema,
  presignDocumentSchema,
  registerApplicantSchema,
  reviewApplicationSchema,
  saveApplicationSchema,
  type AcademicApplicationDetailResponse,
  type AcademicApplicationsResponse,
  type ApplicationResponse,
  type DocumentDownloadUrl,
  type DocumentsResponse,
  type PaymentResponse,
  type PresignDocumentResponse,
  type ProgrammesResponse,
  type SessionResponse,
} from '@stackedu/shared'
import { env } from '../config/env'
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/cookies'
import { badRequest, validationFailed } from '../lib/errors'
import { openLocalFile, writeLocalUpload } from '../lib/storage'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  acknowledgeBankTransfer,
  confirmDocument,
  deleteDocument,
  getApplicationFor,
  getDocumentDownloadForApplicant,
  initiatePayment,
  listApplicantDocuments,
  listProgrammes,
  presignDocument,
  registerApplicant,
  saveApplication,
  submitApplication,
} from '../services/admissions'
import {
  confirmApplicationPayment,
  getApplicationForReview,
  getDocumentDownloadForReview,
  listApplicationsForReview,
  reviewApplication,
} from '../services/admissions-review'
import { resolvePublicInstitution } from '../services/institutions'
import { login } from '../services/auth'

type Variables = RequestVariables & Partial<AuthVariables>

export const admissionRoutes = new Hono<{ Variables: Variables }>()

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

/** The programmes someone can apply to. Public — there is no account yet. */
admissionRoutes.get('/apply/programmes', async (c) => {
  const institution = await resolvePublicInstitution(c.req.header('host'))
  const programmes = await listProgrammes(institution.id)

  return c.json<ProgrammesResponse>({ programmes })
})

/**
 * Creates the applicant's account and their draft application, then signs them
 * in. Registering and then being asked to log in again would be a pointless
 * extra step at the very start of the relationship.
 */
admissionRoutes.post('/apply/register', async (c) => {
  const parsed = registerApplicantSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const institution = await resolvePublicInstitution(c.req.header('host'))
  const created = await registerApplicant(institution.id, parsed.data)

  const session = await login({
    identifier: created.email,
    password: parsed.data.password,
    ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim(),
    userAgent: c.req.header('user-agent'),
  })

  if (session.status !== 'session') {
    throw new Error('Applicant registration did not return a session.')
  }

  setCookie(c, SESSION_COOKIE, session.cookieValue, sessionCookieOptions(env(), session.expiresAt))

  c.get('logger').info('Applicant registered', {
    reference: created.reference,
    institution: institution.slug,
  })

  return c.json<SessionResponse>({ user: session.user }, 201)
})

/**
 * Local-driver PUT target. Authenticated by a short-lived HMAC token, not the
 * session cookie, so the browser can upload with a plain fetch.
 */
admissionRoutes.put(
  '/apply/documents/upload/:token',
  bodyLimit({ maxSize: 10 * 1024 * 1024 }),
  async (c) => {
    const token = c.req.param('token')
    const lengthHeader = c.req.header('content-length')
    const contentLength = lengthHeader ? Number(lengthHeader) : undefined
    const bytes = Buffer.from(await c.req.arrayBuffer())
    if (bytes.byteLength === 0) throw badRequest('Upload body is missing.')

    await writeLocalUpload(token, bytes, contentLength)
    return c.body(null, 204)
  },
)

admissionRoutes.get('/apply/documents/file/:token', async (c) => {
  const { stream, fileKey } = openLocalFile(c.req.param('token'))
  const fileName = fileKey.split('/').pop() ?? 'document'
  c.header('Content-Type', 'application/octet-stream')
  c.header('Content-Disposition', `attachment; filename="${fileName}"`)
  c.header('Cache-Control', 'private, no-store')
  return c.body(stream as unknown as ReadableStream)
})

const applicantOnly = [requireAuth, requireRole('Applicant')] as const
const academicOnly = [requireAuth, requireRole('AcademicAdmin')] as const

admissionRoutes.get('/apply/application', ...applicantOnly, async (c) => {
  const user = c.get('user')!
  const application = await getApplicationFor(user.institution.id, user.id)
  return c.json<ApplicationResponse>({ application })
})

admissionRoutes.patch('/apply/application', ...applicantOnly, async (c) => {
  const parsed = saveApplicationSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const application = await saveApplication(user.institution.id, user.id, parsed.data)
  return c.json<ApplicationResponse>({ application })
})

admissionRoutes.get('/apply/documents', ...applicantOnly, async (c) => {
  const user = c.get('user')!
  const documents = await listApplicantDocuments(user.institution.id, user.id)
  return c.json<DocumentsResponse>({ documents })
})

admissionRoutes.post('/apply/documents/presign', ...applicantOnly, async (c) => {
  const parsed = presignDocumentSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const result = await presignDocument(user.institution.id, user.id, parsed.data)
  return c.json<PresignDocumentResponse>(result, 201)
})

admissionRoutes.post('/apply/documents/confirm', ...applicantOnly, async (c) => {
  const parsed = confirmDocumentSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const documents = await confirmDocument(user.institution.id, user.id, parsed.data.documentId)
  return c.json<DocumentsResponse>({ documents })
})

admissionRoutes.delete('/apply/documents/:documentId', ...applicantOnly, async (c) => {
  const user = c.get('user')!
  const documents = await deleteDocument(user.institution.id, user.id, c.req.param('documentId'))
  return c.json<DocumentsResponse>({ documents })
})

admissionRoutes.get('/apply/documents/:documentId/url', ...applicantOnly, async (c) => {
  const user = c.get('user')!
  const result = await getDocumentDownloadForApplicant(
    user.institution.id,
    user.id,
    c.req.param('documentId'),
  )
  return c.json<DocumentDownloadUrl>(result)
})

admissionRoutes.post('/apply/payment', ...applicantOnly, async (c) => {
  const parsed = initiatePaymentSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const payment = await initiatePayment(user.institution.id, user.id, parsed.data)
  c.get('logger').info('Application payment initiated', {
    reference: payment.reference,
    status: payment.status,
    method: payment.method,
  })
  return c.json<PaymentResponse>({ payment }, 201)
})

admissionRoutes.post('/apply/payment/acknowledge-bank', ...applicantOnly, async (c) => {
  const user = c.get('user')!
  const payment = await acknowledgeBankTransfer(user.institution.id, user.id)
  return c.json<PaymentResponse>({ payment })
})

admissionRoutes.post('/apply/application/submit', ...applicantOnly, async (c) => {
  const user = c.get('user')!
  const application = await submitApplication(user.institution.id, user.id)
  c.get('logger').info('Application submitted', { reference: application.reference })
  return c.json<ApplicationResponse>({ application })
})

/** Academic admissions inbox — never lists Draft applications. */
admissionRoutes.get('/academic/applications', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const applications = await listApplicationsForReview(user.institution.id, {
    status: c.req.query('status') ?? undefined,
    q: c.req.query('q') ?? undefined,
  })
  return c.json<AcademicApplicationsResponse>({ applications })
})

admissionRoutes.get('/academic/applications/:id', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const application = await getApplicationForReview(user.institution.id, c.req.param('id'))
  return c.json<AcademicApplicationDetailResponse>({ application })
})

admissionRoutes.post('/academic/applications/:id/decision', ...academicOnly, async (c) => {
  const parsed = reviewApplicationSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))

  const user = c.get('user')!
  const application = await reviewApplication(
    user.institution.id,
    c.req.param('id'),
    user.id,
    parsed.data,
  )
  c.get('logger').info('Application reviewed', {
    reference: application.reference,
    decision: parsed.data.decision,
  })
  return c.json<AcademicApplicationDetailResponse>({ application })
})

admissionRoutes.post('/academic/applications/:id/confirm-payment', ...academicOnly, async (c) => {
  const user = c.get('user')!
  const application = await confirmApplicationPayment(
    user.institution.id,
    c.req.param('id'),
    user.id,
  )
  return c.json<AcademicApplicationDetailResponse>({ application })
})

admissionRoutes.get(
  '/academic/applications/:id/documents/:documentId/url',
  ...academicOnly,
  async (c) => {
    const user = c.get('user')!
    const result = await getDocumentDownloadForReview(
      user.institution.id,
      c.req.param('id'),
      c.req.param('documentId'),
    )
    return c.json<DocumentDownloadUrl>(result)
  },
)
