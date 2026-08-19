import type {
  AcademicApplicationDetail,
  AcademicApplicationDetailResponse,
  AcademicApplicationsResponse,
  AcademicApplicationSummary,
  Application,
  ApplicationDocument,
  ApplicationResponse,
  ConfirmDocumentRequest,
  DocumentDownloadUrl,
  DocumentsResponse,
  InitiatePaymentRequest,
  PaymentResponse,
  PresignDocumentRequest,
  PresignDocumentResponse,
  ProgrammeOption,
  ProgrammesResponse,
  RegisterApplicantRequest,
  RegisterApplicantResponse,
  ResendApplicantVerificationRequest,
  ReviewApplicationRequest,
  SaveApplicationRequest,
  SessionResponse,
  SessionUser,
  VerifyApplicantEmailRequest,
  ApplicationPayment,
} from '@stackedu/shared'
import { api, API_URL, ApiClientError } from './client'

export const programmesQueryKey = ['admissions', 'programmes'] as const
export const applicationQueryKey = ['admissions', 'application'] as const
export const academicApplicationsQueryKey = ['academic', 'applications'] as const

export async function getProgrammes(): Promise<ProgrammeOption[]> {
  const { programmes } = await api.get<ProgrammesResponse>('/apply/programmes')
  return programmes
}

/** Creates the account and draft application. Sign-in happens after email verification. */
export async function registerApplicant(
  input: RegisterApplicantRequest,
): Promise<RegisterApplicantResponse> {
  return api.post<RegisterApplicantResponse>('/apply/register', input)
}

export async function verifyApplicantEmail(
  input: VerifyApplicantEmailRequest,
): Promise<SessionUser> {
  const { user } = await api.post<SessionResponse>('/apply/verify-email', input)
  return user
}

export async function resendApplicantVerification(
  input: ResendApplicantVerificationRequest,
): Promise<void> {
  await api.post('/apply/resend-verification', input)
}

export async function getApplication(): Promise<Application> {
  const { application } = await api.get<ApplicationResponse>('/apply/application')
  return application
}

export async function saveApplication(input: SaveApplicationRequest): Promise<Application> {
  const { application } = await api.patch<ApplicationResponse>('/apply/application', input)
  return application
}

export async function submitApplication(): Promise<Application> {
  const { application } = await api.post<ApplicationResponse>('/apply/application/submit')
  return application
}

export async function submitDocumentResponse(): Promise<Application> {
  const { application } = await api.post<ApplicationResponse>('/apply/documents/submit-response')
  return application
}

export async function listDocuments(): Promise<ApplicationDocument[]> {
  const { documents } = await api.get<DocumentsResponse>('/apply/documents')
  return documents
}

export async function presignDocument(
  input: PresignDocumentRequest,
): Promise<PresignDocumentResponse> {
  return api.post<PresignDocumentResponse>('/apply/documents/presign', input)
}

export async function confirmDocument(
  input: ConfirmDocumentRequest,
): Promise<ApplicationDocument[]> {
  const { documents } = await api.post<DocumentsResponse>('/apply/documents/confirm', input)
  return documents
}

export async function deleteDocument(documentId: string): Promise<ApplicationDocument[]> {
  const { documents } = await api.delete<DocumentsResponse>(`/apply/documents/${documentId}`)
  return documents
}

function mimeForFile(file: File): string {
  if (file.type) return file.type
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

export async function uploadApplicationDocument(input: {
  documentType: PresignDocumentRequest['documentType'] | string
  file: File
}): Promise<ApplicationDocument[]> {
  const reservation = await presignDocument({
    documentType: input.documentType,
    fileName: input.file.name,
    mimeType: mimeForFile(input.file),
    fileSizeBytes: input.file.size,
  })

  const upload = await fetch(reservation.uploadUrl, {
    method: reservation.uploadMethod,
    headers: reservation.headers,
    body: input.file,
  })

  if (!upload.ok) {
    throw new ApiClientError(
      'INTERNAL_ERROR',
      upload.status,
      'We could not upload that file. Please try again.',
    )
  }

  return confirmDocument({ documentId: reservation.documentId })
}

export async function getDocumentDownloadUrl(documentId: string): Promise<DocumentDownloadUrl> {
  return api.get<DocumentDownloadUrl>(`/apply/documents/${documentId}/url`)
}

export async function initiatePayment(
  input: InitiatePaymentRequest,
): Promise<ApplicationPayment> {
  const { payment } = await api.post<PaymentResponse>('/apply/payment', input, {
    idempotencyKey: `pay-${input.method}-${Date.now()}`,
  })
  return payment
}

export async function acknowledgeBankTransfer(): Promise<ApplicationPayment> {
  const { payment } = await api.post<PaymentResponse>('/apply/payment/acknowledge-bank')
  return payment
}

export async function listAcademicApplications(filters?: {
  status?: string
  q?: string
}): Promise<AcademicApplicationSummary[]> {
  const { applications } = await api.get<AcademicApplicationsResponse>('/academic/applications', {
    query: {
      status: filters?.status,
      q: filters?.q,
    },
  })
  return applications
}

export async function getAcademicApplication(
  id: string,
): Promise<AcademicApplicationDetail> {
  const { application } = await api.get<AcademicApplicationDetailResponse>(
    `/academic/applications/${id}`,
  )
  return application
}

export async function decideAcademicApplication(
  id: string,
  input: ReviewApplicationRequest,
): Promise<AcademicApplicationDetail> {
  const { application } = await api.post<AcademicApplicationDetailResponse>(
    `/academic/applications/${id}/decision`,
    input,
  )
  return application
}

export async function confirmAcademicPayment(
  id: string,
): Promise<AcademicApplicationDetail> {
  const { application } = await api.post<AcademicApplicationDetailResponse>(
    `/academic/applications/${id}/confirm-payment`,
  )
  return application
}

export async function getAcademicDocumentUrl(
  applicationId: string,
  documentId: string,
): Promise<DocumentDownloadUrl> {
  return api.get<DocumentDownloadUrl>(
    `/academic/applications/${applicationId}/documents/${documentId}/url`,
  )
}

export { API_URL }
