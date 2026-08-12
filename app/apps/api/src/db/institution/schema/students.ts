import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { programmes, semesters } from './academic'
import { academicStandingEnum, enrolmentStatusEnum, genderEnum } from './enums'
import { users } from './people'

export const students = pgTable(
  'students',
  {
    id: primaryKeyColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Printed on cards and transcripts, e.g. STU-2024-0481. */
    studentNumber: text('student_number').notNull(),
    programmeId: uuid('programme_id')
      .notNull()
      .references(() => programmes.id, { onDelete: 'restrict' }),
    yearOfStudy: integer('year_of_study').notNull().default(1),
    enrolmentStatus: enrolmentStatusEnum('enrolment_status').notNull().default('Active'),
    /** Blocks results and registration until fees are settled. */
    feeHold: boolean('fee_hold').notNull().default(false),
    admittedAt: date('admitted_at'),
    expectedGraduationAt: date('expected_graduation_at'),
    graduatedAt: date('graduated_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('students_number_key').on(t.studentNumber),
    uniqueIndex('students_user_key').on(t.userId),
    index('students_programme_idx').on(t.programmeId, t.yearOfStudy),
    index('students_status_idx').on(t.enrolmentStatus),
  ],
)

export const studentProfiles = pgTable(
  'student_profiles',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    dateOfBirth: date('date_of_birth'),
    gender: genderEnum('gender'),
    nationalId: text('national_id'),
    nationality: text('nationality').default('Rwandan'),
    address: text('address'),
    district: text('district'),
    /** Kept separate from the login phone, which may belong to a guardian. */
    contactPhone: text('contact_phone'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    bloodGroup: text('blood_group'),
    disabilities: text('disabilities'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('student_profiles_student_key').on(t.studentId),
    index('student_profiles_national_id_idx').on(t.nationalId),
  ],
)

export const guardians = pgTable(
  'guardians',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    relationship: text('relationship').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    address: text('address'),
    /** Who to call first, and who receives fee notices. */
    isPrimary: boolean('is_primary').notNull().default(false),
    receivesFeeNotices: boolean('receives_fee_notices').notNull().default(true),
    ...timestamps(),
  },
  (t) => [index('guardians_student_idx').on(t.studentId)],
)

/** One row per student per semester — the record that they were enrolled then. */
export const enrolments = pgTable(
  'enrolments',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'restrict' }),
    yearOfStudy: integer('year_of_study').notNull(),
    status: enrolmentStatusEnum('status').notNull().default('Active'),
    registeredAt: timestamp('registered_at', { withTimezone: true, mode: 'string' }),
    creditsRegistered: integer('credits_registered').notNull().default(0),
    creditsEarned: integer('credits_earned').notNull().default(0),
    /** Stored with 2 decimal places; never used for money. */
    semesterGpa: numeric('semester_gpa', { precision: 4, scale: 2 }),
    cgpa: numeric('cgpa', { precision: 4, scale: 2 }),
    academicStanding: academicStandingEnum('academic_standing').notNull().default('Good'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('enrolments_student_semester_key').on(t.studentId, t.semesterId),
    index('enrolments_semester_idx').on(t.semesterId),
  ],
)

/** Every change of status, kept because these decisions get appealed. */
export const enrolmentHistory = pgTable(
  'enrolment_history',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    fromStatus: enrolmentStatusEnum('from_status'),
    toStatus: enrolmentStatusEnum('to_status').notNull(),
    reason: text('reason'),
    effectiveDate: date('effective_date').notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamps().createdAt,
  },
  (t) => [index('enrolment_history_student_idx').on(t.studentId, t.createdAt)],
)

export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    /** Completed step keys, so the student resumes where they stopped. */
    completedSteps: jsonb('completed_steps').$type<string[]>().notNull().default([]),
    currentStep: text('current_step'),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [uniqueIndex('onboarding_progress_student_key').on(t.studentId)],
)
