import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { money, primaryKeyColumn, timestamps } from '../../columns'
import { programmes, semesters } from './academic'
import { applicationStatusEnum, genderEnum, paymentMethodEnum, paymentStatusEnum } from './enums'
import { users } from './people'
import { students } from './students'

/**
 * Admissions. Applicants are not users — they have no login until they are
 * accepted — so their details live here rather than in the users table.
 */

export const applications = pgTable(
  'applications',
  {
    id: primaryKeyColumn(),
    /** Shown to the applicant, and usable in place of their email to sign in. */
    reference: text('reference').notNull(),
    /** The applicant's own account, created when they start the application. */
    applicantUserId: uuid('applicant_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programmes.id, { onDelete: 'restrict' }),
    intakeSemesterId: uuid('intake_semester_id').references(() => semesters.id, {
      onDelete: 'set null',
    }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    dateOfBirth: date('date_of_birth'),
    gender: genderEnum('gender'),
    nationalId: text('national_id'),
    previousQualification: text('previous_qualification'),
    previousInstitution: text('previous_institution'),
    /**
     * Answers from the longer parts of the form — guardian, personal statement,
     * accessibility needs. Kept as one document because these are read back as
     * a whole when a reviewer opens the application and are never queried
     * field by field.
     */
    details: jsonb('details').$type<Record<string, unknown>>(),
    status: applicationStatusEnum('status').notNull().default('Draft'),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'string' }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    /** Set once accepted and converted, linking the applicant to their student record. */
    convertedStudentId: uuid('converted_student_id').references(() => students.id, {
      onDelete: 'set null',
    }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('applications_reference_key').on(t.reference),
    index('applications_status_idx').on(t.status, t.createdAt),
    index('applications_email_idx').on(t.email),
    index('applications_programme_idx').on(t.programmeId),
  ],
)

export const applicationDocuments = pgTable(
  'application_documents',
  {
    id: primaryKeyColumn(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    /** e.g. NationalId, Transcript, Certificate, Photo. */
    documentType: text('document_type').notNull(),
    fileName: text('file_name').notNull(),
    /** Object key in Cloudflare R2. Links are signed on demand, never stored public. */
    fileKey: text('file_key').notNull(),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: text('mime_type'),
    verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'string' }),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
  },
  (t) => [index('application_documents_application_idx').on(t.applicationId)],
)

export const applicationReviews = pgTable(
  'application_reviews',
  {
    id: primaryKeyColumn(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    decision: applicationStatusEnum('decision').notNull(),
    comments: text('comments'),
    createdAt: timestamps().createdAt,
  },
  (t) => [index('application_reviews_application_idx').on(t.applicationId, t.createdAt)],
)

/** The non-refundable fee charged to apply, separate from tuition. */
export const applicationPayments = pgTable(
  'application_payments',
  {
    id: primaryKeyColumn(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    reference: text('reference').notNull(),
    amount: money('amount').notNull(),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('Pending'),
    gatewayReference: text('gateway_reference'),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('application_payments_reference_key').on(t.reference),
    index('application_payments_application_idx').on(t.applicationId),
  ],
)

export const admissionOffers = pgTable(
  'admission_offers',
  {
    id: primaryKeyColumn(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programmes.id, { onDelete: 'restrict' }),
    offerLetterKey: text('offer_letter_key'),
    /** An unaccepted offer expires so the place can be released to someone else. */
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'string' }),
    declinedAt: timestamp('declined_at', { withTimezone: true, mode: 'string' }),
    isConditional: boolean('is_conditional').notNull().default(false),
    conditions: text('conditions'),
    issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('admission_offers_application_key').on(t.applicationId),
    index('admission_offers_expiry_idx').on(t.expiresAt),
  ],
)
