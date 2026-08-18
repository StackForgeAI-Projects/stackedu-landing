import { z } from 'zod'
import {
  applicationStatusSchema,
  genderSchema,
  paymentMethodSchema,
  paymentStatusSchema,
} from '../enums'
import { emailSchema, isoDateTimeSchema, phoneSchema, uuidSchema } from '../primitives'

/**
 * Admissions contracts — the public application flow.
 *
 * An applicant holds a real account from the moment they start, because they
 * need to come back to an unfinished form and to follow the decision
 * afterwards. They sign in with their email or the application reference.
 */

export const programmeOptionSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  level: z.string(),
  durationYears: z.number().int(),
})

export const registerApplicantSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(160, 'Full name is too long.'),
  email: emailSchema,
  phone: phoneSchema,
  programmeId: uuidSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(200, 'Password is too long.')
    .regex(/[0-9]/, 'Password must include at least one number.')
    .regex(/[a-zA-Z]/, 'Password must include at least one letter.'),
})

export const verifyApplicantEmailSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits.'),
  password: z.string().min(1, 'Enter your password.').max(200, 'Password is too long.'),
})

export const resendApplicantVerificationSchema = z.object({
  email: emailSchema,
})

export const registerApplicantResponseSchema = z.object({
  email: emailSchema,
  fullName: z.string(),
  reference: z.string(),
})

/**
 * Everything the seven-step form can save.
 *
 * All optional: the form saves as the applicant goes, and a half-finished
 * application is a normal state rather than an error.
 */
export const saveApplicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(160, 'Full name is too long.')
    .optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().date().optional(),
  gender: genderSchema.optional(),
  nationalId: z.string().max(60).optional(),
  previousInstitution: z.string().max(200).optional(),
  previousQualification: z.string().max(120).optional(),
  programmeId: uuidSchema.optional(),
  /** Guardian, personal statement and the other longer answers. */
  details: z.record(z.string(), z.unknown()).optional(),
})

/** Stored `application_documents.document_type` values. */
export const applicationDocumentTypeSchema = z.enum([
  'NationalId',
  'SchoolCertificate',
  'Transcript',
  'Photo',
  'MedicalInsurance',
  'BirthCertificate',
])

/** Required before fee payment / submit. Birth certificate stays optional. */
export const REQUIRED_APPLICATION_DOCUMENT_TYPES = [
  'NationalId',
  'SchoolCertificate',
  'Transcript',
  'Photo',
  'MedicalInsurance',
] as const satisfies ReadonlyArray<z.infer<typeof applicationDocumentTypeSchema>>

/** Stored document keys — standard enum values or `Other:<name>` for ad-hoc requests. */
export const storedDocumentTypeSchema = z.union([
  applicationDocumentTypeSchema,
  z.string().regex(/^Other:.{2,120}$/),
])

export const requestedDocumentsSchema = z.object({
  types: z.array(applicationDocumentTypeSchema).default([]),
  custom: z.array(z.string().trim().min(2).max(120)).default([]),
})

export const reviewApplicationDecisionSchema = z.enum([
  'UnderReview',
  'DocumentsRequested',
  'Accepted',
  'Rejected',
])

export const applicationDocumentRequestSchema = z.object({
  comments: z.string().nullable(),
  requestedDocuments: requestedDocumentsSchema,
  requestedAt: isoDateTimeSchema,
})

export const applicationReviewSchema = z.object({
  id: uuidSchema,
  decision: reviewApplicationDecisionSchema,
  comments: z.string().nullable(),
  requestedDocuments: requestedDocumentsSchema.nullable(),
  reviewerName: z.string(),
  createdAt: isoDateTimeSchema,
})

export const applicationDocumentSchema = z.object({
  id: uuidSchema,
  documentType: storedDocumentTypeSchema,
  fileName: z.string().trim().min(1).max(200),
  fileSizeBytes: z.number().int().nonnegative().nullable(),
  mimeType: z.string().nullable(),
  uploadedAt: isoDateTimeSchema,
})

export const applicationPaymentSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  amount: z.number().int().nonnegative(),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  paidAt: z.string().nullable(),
  createdAt: z.string(),
})

export const applicationSchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  status: applicationStatusSchema,
  fullName: z.string(),
  email: emailSchema,
  phone: z.string(),
  programme: programmeOptionSchema.nullable(),
  dateOfBirth: z.string().nullable(),
  gender: genderSchema.nullable(),
  nationalId: z.string().nullable(),
  previousInstitution: z.string().nullable(),
  previousQualification: z.string().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
  documents: z.array(applicationDocumentSchema),
  payment: applicationPaymentSchema.nullable(),
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  documentRequest: applicationDocumentRequestSchema.nullable(),
})

export const applicationResponseSchema = z.object({ application: applicationSchema })
export const programmesResponseSchema = z.object({ programmes: z.array(programmeOptionSchema) })

export const documentsResponseSchema = z.object({
  documents: z.array(applicationDocumentSchema),
})

export const presignDocumentSchema = z.object({
  documentType: storedDocumentTypeSchema,
  fileName: z.string().trim().min(1).max(200),
  mimeType: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Enter a valid file type'),
  fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
})

export const presignDocumentResponseSchema = z.object({
  documentId: uuidSchema,
  fileKey: z.string(),
  uploadUrl: z.string().url(),
  uploadMethod: z.enum(['PUT']),
  headers: z.record(z.string(), z.string()),
})

export const confirmDocumentSchema = z.object({
  documentId: uuidSchema,
})

export const initiatePaymentSchema = z.object({
  method: paymentMethodSchema,
  /** Required for MoMo / Airtel so a USSD push (or sandbox confirm) has a number. */
  payerPhone: phoneSchema.optional(),
})

export const paymentResponseSchema = z.object({
  payment: applicationPaymentSchema,
})

export const reviewApplicationSchema = z
  .object({
    decision: reviewApplicationDecisionSchema,
    comments: z.string().trim().max(4000).optional(),
    requestedDocuments: requestedDocumentsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision !== 'DocumentsRequested') return
    const types = value.requestedDocuments?.types ?? []
    const custom = value.requestedDocuments?.custom ?? []
    if (types.length + custom.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requestedDocuments'],
        message: 'Select at least one document to request.',
      })
    }
  })

export const academicApplicationSummarySchema = z.object({
  id: uuidSchema,
  reference: z.string(),
  fullName: z.string(),
  email: emailSchema,
  phone: z.string(),
  programmeName: z.string(),
  programmeCode: z.string(),
  status: applicationStatusSchema,
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  paymentStatus: paymentStatusSchema.nullable(),
  documentCount: z.number().int().nonnegative(),
})

export const academicApplicationsResponseSchema = z.object({
  applications: z.array(academicApplicationSummarySchema),
})

export const academicApplicationDetailSchema = academicApplicationSummarySchema.extend({
  dateOfBirth: z.string().nullable(),
  gender: genderSchema.nullable(),
  nationalId: z.string().nullable(),
  previousInstitution: z.string().nullable(),
  previousQualification: z.string().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
  documents: z.array(applicationDocumentSchema),
  payment: applicationPaymentSchema.nullable(),
  reviews: z.array(applicationReviewSchema),
})

export const academicApplicationDetailResponseSchema = z.object({
  application: academicApplicationDetailSchema,
})

export const documentDownloadUrlSchema = z.object({
  url: z.string().url(),
  expiresAt: isoDateTimeSchema,
})

export type ProgrammeOption = z.infer<typeof programmeOptionSchema>
export type RegisterApplicantRequest = z.infer<typeof registerApplicantSchema>
export type RegisterApplicantResponse = z.infer<typeof registerApplicantResponseSchema>
export type VerifyApplicantEmailRequest = z.infer<typeof verifyApplicantEmailSchema>
export type ResendApplicantVerificationRequest = z.infer<typeof resendApplicantVerificationSchema>
export type SaveApplicationRequest = z.infer<typeof saveApplicationSchema>
export type ApplicationDocumentType = z.infer<typeof applicationDocumentTypeSchema>
export type ApplicationDocument = z.infer<typeof applicationDocumentSchema>
export type ApplicationPayment = z.infer<typeof applicationPaymentSchema>
export type Application = z.infer<typeof applicationSchema>
export type ApplicationResponse = z.infer<typeof applicationResponseSchema>
export type ProgrammesResponse = z.infer<typeof programmesResponseSchema>
export type DocumentsResponse = z.infer<typeof documentsResponseSchema>
export type PresignDocumentRequest = z.infer<typeof presignDocumentSchema>
export type PresignDocumentResponse = z.infer<typeof presignDocumentResponseSchema>
export type ConfirmDocumentRequest = z.infer<typeof confirmDocumentSchema>
export type InitiatePaymentRequest = z.infer<typeof initiatePaymentSchema>
export type PaymentResponse = z.infer<typeof paymentResponseSchema>
export type ReviewApplicationRequest = z.infer<typeof reviewApplicationSchema>
export type RequestedDocuments = z.infer<typeof requestedDocumentsSchema>
export type ApplicationDocumentRequest = z.infer<typeof applicationDocumentRequestSchema>
export type ApplicationReview = z.infer<typeof applicationReviewSchema>
export type AcademicApplicationSummary = z.infer<typeof academicApplicationSummarySchema>
export type AcademicApplicationsResponse = z.infer<typeof academicApplicationsResponseSchema>
export type AcademicApplicationDetail = z.infer<typeof academicApplicationDetailSchema>
export type AcademicApplicationDetailResponse = z.infer<
  typeof academicApplicationDetailResponseSchema
>
export type DocumentDownloadUrl = z.infer<typeof documentDownloadUrlSchema>
