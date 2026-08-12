import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import {
  applicationStatusSchema,
  type AcademicApplicationDetail,
  type AcademicApplicationSummary,
  type ApplicationDocument,
  type ApplicationDocumentType,
  type ApplicationPayment,
  type ReviewApplicationRequest,
} from '@stackedu/shared'
import { getInstitutionDb } from '../db/connection'
import {
  applicationDocuments,
  applicationPayments,
  applicationReviews,
  applications,
} from '../db/institution/schema/admissions'
import { programmes } from '../db/institution/schema/academic'
import { badRequest, conflict, notFound } from '../lib/errors'
import { createDownloadUrl } from '../lib/storage'
import { confirmPayment } from './admissions'

function mapDocument(row: {
  id: string
  documentType: string
  fileName: string
  fileSizeBytes: number | null
  mimeType: string | null
  createdAt: string
}): ApplicationDocument {
  return {
    id: row.id,
    documentType: row.documentType as ApplicationDocumentType,
    fileName: row.fileName,
    fileSizeBytes: row.fileSizeBytes,
    mimeType: row.mimeType,
    uploadedAt: row.createdAt,
  }
}

function mapPayment(row: {
  id: string
  reference: string
  amount: number
  method: ApplicationPayment['method']
  status: ApplicationPayment['status']
  paidAt: string | null
  createdAt: string
}): ApplicationPayment {
  return {
    id: row.id,
    reference: row.reference,
    amount: row.amount,
    method: row.method,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
  }
}

/** Submitted applications and later — drafts stay private to the applicant. */
export async function listApplicationsForReview(
  institutionId: string,
  filters: { status?: string; q?: string } = {},
): Promise<AcademicApplicationSummary[]> {
  const db = await getInstitutionDb(institutionId)

  const conditions = [ne(applications.status, 'Draft')]
  if (filters.status && filters.status !== 'All') {
    const status = applicationStatusSchema.safeParse(filters.status)
    if (!status.success) throw badRequest('Unknown application status filter.')
    conditions.push(eq(applications.status, status.data))
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`
    conditions.push(
      or(
        ilike(applications.reference, term),
        ilike(applications.firstName, term),
        ilike(applications.lastName, term),
        ilike(applications.email, term),
        ilike(programmes.name, term),
      )!,
    )
  }

  const rows = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      status: applications.status,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      createdAt: applications.createdAt,
      programmeName: programmes.name,
      programmeCode: programmes.code,
      documentCount: sql<number>`(
        select count(*)::int from application_documents d
        where d.application_id = ${applications.id}
      )`,
      paymentStatus: sql<ApplicationPayment['status'] | null>`(
        select p.status from application_payments p
        where p.application_id = ${applications.id}
        order by p.created_at desc
        limit 1
      )`,
    })
    .from(applications)
    .innerJoin(programmes, eq(programmes.id, applications.programmeId))
    .where(and(...conditions))
    .orderBy(desc(applications.submittedAt), desc(applications.createdAt))

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    fullName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone,
    programmeName: row.programmeName,
    programmeCode: row.programmeCode,
    status: row.status,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    paymentStatus: row.paymentStatus,
    documentCount: Number(row.documentCount ?? 0),
  }))
}

export async function getApplicationForReview(
  institutionId: string,
  applicationId: string,
): Promise<AcademicApplicationDetail> {
  const db = await getInstitutionDb(institutionId)

  const [row] = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      status: applications.status,
      dateOfBirth: applications.dateOfBirth,
      gender: applications.gender,
      nationalId: applications.nationalId,
      previousInstitution: applications.previousInstitution,
      previousQualification: applications.previousQualification,
      details: applications.details,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      createdAt: applications.createdAt,
      programmeName: programmes.name,
      programmeCode: programmes.code,
    })
    .from(applications)
    .innerJoin(programmes, eq(programmes.id, applications.programmeId))
    .where(and(eq(applications.id, applicationId), ne(applications.status, 'Draft')))
    .limit(1)

  if (!row) throw notFound('Application')

  const docs = await db
    .select({
      id: applicationDocuments.id,
      documentType: applicationDocuments.documentType,
      fileName: applicationDocuments.fileName,
      fileSizeBytes: applicationDocuments.fileSizeBytes,
      mimeType: applicationDocuments.mimeType,
      createdAt: applicationDocuments.createdAt,
    })
    .from(applicationDocuments)
    .where(eq(applicationDocuments.applicationId, applicationId))
    .orderBy(asc(applicationDocuments.createdAt))

  const [payment] = await db
    .select({
      id: applicationPayments.id,
      reference: applicationPayments.reference,
      amount: applicationPayments.amount,
      method: applicationPayments.method,
      status: applicationPayments.status,
      paidAt: applicationPayments.paidAt,
      createdAt: applicationPayments.createdAt,
    })
    .from(applicationPayments)
    .where(eq(applicationPayments.applicationId, applicationId))
    .orderBy(desc(applicationPayments.createdAt))
    .limit(1)

  return {
    id: row.id,
    reference: row.reference,
    fullName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone,
    programmeName: row.programmeName,
    programmeCode: row.programmeCode,
    status: row.status,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    paymentStatus: payment?.status ?? null,
    documentCount: docs.length,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    nationalId: row.nationalId,
    previousInstitution: row.previousInstitution,
    previousQualification: row.previousQualification,
    details: row.details ?? null,
    documents: docs.map(mapDocument),
    payment: payment ? mapPayment(payment) : null,
  }
}

export async function reviewApplication(
  institutionId: string,
  applicationId: string,
  reviewerId: string,
  input: ReviewApplicationRequest,
): Promise<AcademicApplicationDetail> {
  const db = await getInstitutionDb(institutionId)
  const current = await getApplicationForReview(institutionId, applicationId)

  if (current.status === 'Accepted' || current.status === 'Rejected') {
    throw conflict('This application already has a final decision.')
  }

  if (
    input.decision === 'Accepted' &&
    current.payment?.status !== 'Completed'
  ) {
    throw badRequest('Confirm the application fee is paid before accepting.')
  }

  await db.insert(applicationReviews).values({
    applicationId,
    reviewerId,
    decision: input.decision,
    comments: input.comments?.trim() || null,
  })

  await db
    .update(applications)
    .set({
      status: input.decision,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(applications.id, applicationId))

  return getApplicationForReview(institutionId, applicationId)
}

export async function confirmApplicationPayment(
  institutionId: string,
  applicationId: string,
  actorUserId: string,
): Promise<AcademicApplicationDetail> {
  await getApplicationForReview(institutionId, applicationId)
  await confirmPayment(institutionId, applicationId, actorUserId)
  return getApplicationForReview(institutionId, applicationId)
}

export async function getDocumentDownloadForReview(
  institutionId: string,
  applicationId: string,
  documentId: string,
) {
  await getApplicationForReview(institutionId, applicationId)
  const db = await getInstitutionDb(institutionId)
  const [row] = await db
    .select({ fileKey: applicationDocuments.fileKey })
    .from(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.id, documentId),
        eq(applicationDocuments.applicationId, applicationId),
      ),
    )
    .limit(1)

  if (!row) throw notFound('That document')
  return createDownloadUrl(row.fileKey)
}
