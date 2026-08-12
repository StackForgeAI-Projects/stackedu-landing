import { z } from 'zod'
import { academicStandingSchema, enrolmentStatusSchema, genderSchema } from '../enums'
import {
  emailSchema,
  isoDateSchema,
  isoDateTimeSchema,
  phoneSchema,
  uuidSchema,
} from '../primitives'

export const personalDetailsSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth: isoDateSchema,
  gender: genderSchema,
  nationalId: z.string().trim().min(1).max(32),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().trim().max(500),
})

export const academicRecordSchema = z.object({
  semesterGpa: z.number().min(0).max(5),
  cgpa: z.number().min(0).max(5),
  totalCreditsEarned: z.number().int().nonnegative(),
  academicStanding: academicStandingSchema,
})

export const studentSchema = z.object({
  id: uuidSchema,
  /** Human-readable identifier shown on cards and transcripts, e.g. STU-2024-0481. */
  studentNumber: z.string().trim().min(1).max(32),
  institutionId: uuidSchema,
  personalDetails: personalDetailsSchema,
  enrolmentStatus: enrolmentStatusSchema,
  programme: z.string().trim().min(1).max(200),
  yearOfStudy: z.number().int().min(1).max(8),
  feeHold: z.boolean(),
  academicRecord: academicRecordSchema,
  createdAt: isoDateTimeSchema,
})

export type PersonalDetails = z.infer<typeof personalDetailsSchema>
export type AcademicRecord = z.infer<typeof academicRecordSchema>
export type Student = z.infer<typeof studentSchema>
