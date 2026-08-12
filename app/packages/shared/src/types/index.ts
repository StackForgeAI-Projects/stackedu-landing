/**
 * Types are inferred from the Zod schemas rather than hand-written, so a
 * validation rule and its TypeScript type can never drift apart.
 */
export type {
  AcademicStanding,
  AiJobStatus,
  ApplicationStatus,
  AssessmentType,
  AttendanceStatus,
  DeliveryStatus,
  EnrolmentStatus,
  Gender,
  Grade,
  InstitutionStatus,
  InvoiceStatus,
  NotificationChannel,
  PaymentMethod,
  PaymentStatus,
  ReconciliationStatus,
  RegistrationStatus,
  ResourceType,
  ResultBatchStatus,
  RiskLevel,
  SemesterStatus,
  SubmissionStatus,
  UserRole,
} from '../enums'

export type { Pagination } from '../primitives'

export type {
  AccessScope,
  AcademicRecord,
  ApiError,
  ApiErrorCode,
  Application,
  ApplicationDocument,
  Course,
  CreateInstitutionInput,
  Health,
  Institution,
  LibraryResource,
  Mark,
  Paginated,
  Payment,
  PersonalDetails,
  Result,
  Student,
  User,
} from '../schemas/index'
