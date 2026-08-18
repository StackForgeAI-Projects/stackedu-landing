import type { ApplicationDocumentType, RequestedDocuments } from '@stackedu/shared'
import {
  APPLICATION_DOCUMENT_LABELS,
  buildCustomDocumentType,
  isAllowedRequestedDocument,
  isCustomDocumentType,
} from '@stackedu/shared'
import { badRequest } from './errors'

const ALLOWED_MIME: Record<ApplicationDocumentType, readonly string[]> = {
  NationalId: ['application/pdf', 'image/jpeg', 'image/png'],
  SchoolCertificate: ['application/pdf'],
  Transcript: ['application/pdf'],
  Photo: ['image/jpeg', 'image/png'],
  MedicalInsurance: ['application/pdf', 'image/jpeg', 'image/png'],
  BirthCertificate: ['application/pdf', 'image/jpeg', 'image/png'],
}

const MAX_BYTES: Record<ApplicationDocumentType, number> = {
  NationalId: 5 * 1024 * 1024,
  SchoolCertificate: 10 * 1024 * 1024,
  Transcript: 10 * 1024 * 1024,
  Photo: 2 * 1024 * 1024,
  MedicalInsurance: 5 * 1024 * 1024,
  BirthCertificate: 5 * 1024 * 1024,
}

const CUSTOM_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const
const CUSTOM_MAX_BYTES = 10 * 1024 * 1024

export function normalizeRequestedDocuments(
  input: RequestedDocuments | null | undefined,
): RequestedDocuments | null {
  if (!input) return null
  const types = input.types ?? []
  const custom = (input.custom ?? []).map((name) => name.trim()).filter(Boolean)
  if (types.length + custom.length === 0) return null
  return { types, custom }
}

export function assertDocumentUploadAllowed(input: {
  applicationStatus: string
  documentType: string
  documentRequest: RequestedDocuments | null
}): void {
  if (input.applicationStatus === 'Draft') return
  if (input.applicationStatus !== 'DocumentsRequested' || !input.documentRequest) {
    throw badRequest('Your application has been submitted and can no longer be changed.')
  }
  if (!isAllowedRequestedDocument(input.documentType, input.documentRequest)) {
    throw badRequest('That document was not requested by admissions.')
  }
}

export function assertDocumentDeleteAllowed(input: {
  applicationStatus: string
  documentRequest: RequestedDocuments | null
}): void {
  if (input.applicationStatus === 'Draft') return
  if (input.applicationStatus !== 'DocumentsRequested') {
    throw badRequest('Uploaded documents can no longer be removed.')
  }
}

export function mimeRulesForDocumentType(documentType: string): {
  allowed: readonly string[]
  maxBytes: number
} {
  if (isCustomDocumentType(documentType)) {
    return { allowed: CUSTOM_ALLOWED_MIME, maxBytes: CUSTOM_MAX_BYTES }
  }
  if (!(documentType in APPLICATION_DOCUMENT_LABELS)) {
    throw badRequest('Unknown document type.')
  }
  const key = documentType as ApplicationDocumentType
  return { allowed: ALLOWED_MIME[key], maxBytes: MAX_BYTES[key] }
}

export function mapStoredDocumentType(documentType: string): string {
  return documentType
}

export function buildStoredCustomDocumentType(name: string): string {
  return buildCustomDocumentType(name)
}

export { ALLOWED_MIME, MAX_BYTES }
