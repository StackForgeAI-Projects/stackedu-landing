import { and, asc, desc, eq } from 'drizzle-orm'
import {
  applicationDocumentTypeSchema,
  reviewApplicationDecisionSchema,
  type ApplicationDocumentRequest,
  type ApplicationReview,
  type RequestedDocuments,
} from '@stackedu/shared'
import { normalizeRequestedDocuments } from '../lib/application-documents'
import { getInstitutionDb } from '../db/connection'
import { applicationReviews, applications } from '../db/institution/schema/admissions'
import { users } from '../db/institution/schema/people'

function parseStoredRequestedDocuments(
  value: { types: string[]; custom: string[] } | null | undefined,
): RequestedDocuments | null {
  if (!value) return null
  const types = value.types.filter(
    (type): type is RequestedDocuments['types'][number] =>
      applicationDocumentTypeSchema.safeParse(type).success,
  )
  return normalizeRequestedDocuments({ types, custom: value.custom ?? [] })
}

export async function loadApplicationReviews(
  institutionId: string,
  applicationId: string,
): Promise<ApplicationReview[]> {
  const db = await getInstitutionDb(institutionId)
  const rows = await db
    .select({
      id: applicationReviews.id,
      decision: applicationReviews.decision,
      comments: applicationReviews.comments,
      requestedDocuments: applicationReviews.requestedDocuments,
      createdAt: applicationReviews.createdAt,
      reviewerName: users.fullName,
    })
    .from(applicationReviews)
    .leftJoin(users, eq(users.id, applicationReviews.reviewerId))
    .where(eq(applicationReviews.applicationId, applicationId))
    .orderBy(asc(applicationReviews.createdAt))

  return rows.flatMap((row) => {
    const decision = reviewApplicationDecisionSchema.safeParse(row.decision)
    if (!decision.success) return []
    return [{
      id: row.id,
      decision: decision.data,
      comments: row.comments,
      requestedDocuments: parseStoredRequestedDocuments(row.requestedDocuments),
      reviewerName: row.reviewerName ?? 'Admissions office',
      createdAt: row.createdAt,
    }]
  })
}

export async function loadLatestDocumentRequest(
  institutionId: string,
  applicationId: string,
): Promise<ApplicationDocumentRequest | null> {
  const db = await getInstitutionDb(institutionId)
  const [[row], [applicationRow]] = await Promise.all([
    db
      .select({
        comments: applicationReviews.comments,
        requestedDocuments: applicationReviews.requestedDocuments,
        createdAt: applicationReviews.createdAt,
      })
      .from(applicationReviews)
      .where(
        and(
          eq(applicationReviews.applicationId, applicationId),
          eq(applicationReviews.decision, 'DocumentsRequested'),
        ),
      )
      .orderBy(desc(applicationReviews.createdAt))
      .limit(1),
    db
      .select({ documentResponseSubmittedAt: applications.documentResponseSubmittedAt })
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1),
  ])

  const requestedDocuments = parseStoredRequestedDocuments(row?.requestedDocuments)
  if (!row || !requestedDocuments) return null

  return {
    comments: row.comments,
    requestedDocuments,
    requestedAt: row.createdAt,
    responseSubmittedAt: applicationRow?.documentResponseSubmittedAt ?? null,
  }
}

export function mapRequestedDocumentsForStorage(
  input: RequestedDocuments | null | undefined,
): RequestedDocuments | null {
  return normalizeRequestedDocuments(input)
}
