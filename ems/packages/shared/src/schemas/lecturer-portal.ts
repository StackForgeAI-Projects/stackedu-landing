import { z } from 'zod'
import {
  assessmentTypeSchema,
  attendanceStatusSchema,
  gradeSchema,
  resultBatchStatusSchema,
  riskLevelSchema,
  userRoleSchema,
} from '../enums'
import { isoDateSchema, isoDateTimeSchema, uuidSchema } from '../primitives'
import { academicAtRiskStudentSchema, academicNotificationSchema } from './academic-portal'

export const lecturerProfileSchema = z.object({
  userId: uuidSchema,
  fullName: z.string(),
  firstName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  staffId: z.string(),
  department: z.string(),
  institutionName: z.string(),
  institutionShortName: z.string(),
  unreadCount: z.number().int().nonnegative(),
})

export const lecturerScheduleItemSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  sessionType: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().nullable(),
  dayOfWeek: z.number().int().min(1).max(7),
  color: z.string(),
})

export const lecturerCourseRowSchema = z.object({
  offeringId: uuidSchema,
  courseId: uuidSchema,
  code: z.string(),
  name: z.string(),
  credits: z.number().int(),
  enrolledCount: z.number().int().nonnegative(),
  color: z.string(),
  semesterName: z.string(),
  isLead: z.boolean(),
  nextClass: z.string(),
  nextClassShort: z.string(),
  schedule: z.array(
    z.object({
      day: z.string(),
      time: z.string(),
      room: z.string(),
      type: z.string(),
    }),
  ),
})

export const lecturerCourseStudentSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  attendanceRate: z.number().nullable(),
  lastGrade: z.string().nullable(),
  riskLevel: riskLevelSchema.nullable(),
})

export const lecturerAttendanceSessionSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  sessionDate: isoDateSchema,
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  topic: z.string().nullable(),
  present: z.number().int().nonnegative(),
  late: z.number().int().nonnegative(),
  absent: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  closed: z.boolean(),
  sessionNumber: z.number().int().positive(),
})

export const lecturerPendingActionSchema = z.object({
  id: z.string(),
  task: z.string(),
  due: z.string(),
  href: z.string(),
})

export const lecturerDashboardSchema = z.object({
  profile: lecturerProfileSchema,
  stats: z.object({
    assignedCourses: z.number().int().nonnegative(),
    pendingResultEntries: z.number().int().nonnegative(),
    atRiskStudents: z.number().int().nonnegative(),
    semesterLabel: z.string(),
  }),
  courses: z.array(lecturerCourseRowSchema),
  todaySchedule: z.array(lecturerScheduleItemSchema),
  recentAttendance: z.array(lecturerAttendanceSessionSchema),
  atRisk: z.array(
    z.object({
      id: uuidSchema,
      name: z.string(),
      courseCode: z.string(),
      reason: z.string(),
      riskLevel: riskLevelSchema,
    }),
  ),
  pendingActions: z.array(lecturerPendingActionSchema),
})

export const lecturerCourseDetailSchema = lecturerCourseRowSchema.extend({
  description: z.string().nullable(),
  students: z.array(lecturerCourseStudentSchema),
  materials: z.array(
    z.object({
      id: uuidSchema,
      title: z.string(),
      description: z.string().nullable(),
      moduleName: z.string().nullable(),
    }),
  ),
  assessments: z.array(
    z.object({
      id: uuidSchema,
      title: z.string(),
      type: z.string(),
      weight: z.number(),
      totalMarks: z.number(),
      dueAt: isoDateTimeSchema.nullable(),
      isPublished: z.boolean(),
    }),
  ),
})

export const lecturerAttendanceRecordSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  status: attendanceStatusSchema,
  note: z.string().nullable(),
})

export const lecturerAttendanceDetailSchema = lecturerAttendanceSessionSchema.extend({
  records: z.array(lecturerAttendanceRecordSchema),
})

export const saveLecturerAttendanceRequestSchema = z.object({
  offeringId: uuidSchema,
  sessionDate: isoDateSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  topic: z.string().trim().max(200).optional(),
  close: z.boolean().optional(),
  records: z
    .array(
      z.object({
        studentId: uuidSchema,
        status: attendanceStatusSchema,
        note: z.string().trim().max(300).optional(),
      }),
    )
    .min(1)
    .max(400),
})

export const lecturerResultStudentSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  name: z.string(),
  totalScore: z.number().nullable(),
  grade: gradeSchema.nullable(),
})

export const lecturerResultBatchSchema = z.object({
  offeringId: uuidSchema,
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number().int(),
  status: resultBatchStatusSchema.nullable(),
  batchId: uuidSchema.nullable(),
  rejectionReason: z.string().nullable(),
  submittedAt: isoDateTimeSchema.nullable(),
  students: z.array(lecturerResultStudentSchema),
  avg: z.number().nullable(),
  highest: z.number().nullable(),
  lowest: z.number().nullable(),
  passRate: z.number().nullable(),
})

export const saveLecturerResultsRequestSchema = z.object({
  entries: z
    .array(
      z.object({
        studentId: uuidSchema,
        totalScore: z.number().min(0).max(100),
      }),
    )
    .min(1)
    .max(400),
})

export const lecturerAssessmentRowSchema = z.object({
  id: uuidSchema,
  offeringId: uuidSchema,
  courseCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  type: assessmentTypeSchema,
  weight: z.number(),
  totalMarks: z.number(),
  dueAt: isoDateTimeSchema.nullable(),
  isPublished: z.boolean(),
  acceptsSubmissions: z.boolean(),
  submittedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  status: z.enum(['Draft', 'Active', 'Closed', 'Graded']),
})

export const createLecturerAssessmentRequestSchema = z.object({
  offeringId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  type: assessmentTypeSchema.default('Coursework'),
  weight: z.number().min(0).max(100),
  totalMarks: z.number().positive().max(1000),
  dueAt: isoDateSchema.optional(),
  acceptsSubmissions: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export const lecturerSubmissionRowSchema = z.object({
  studentId: uuidSchema,
  studentNumber: z.string(),
  studentName: z.string(),
  status: z.enum(['Submitted', 'Late', 'Not submitted', 'Graded']),
  submittedAt: isoDateTimeSchema.nullable(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
})

export const lecturerAssessmentDetailSchema = lecturerAssessmentRowSchema.extend({
  submissions: z.array(lecturerSubmissionRowSchema),
})

export const saveLecturerGradeRequestSchema = z.object({
  studentId: uuidSchema,
  score: z.number().min(0),
  feedback: z.string().trim().max(2000).optional(),
})

export const resolveLecturerAtRiskRequestSchema = z.object({
  notes: z.string().trim().min(4).max(500),
})

export const lecturerAtRiskStudentSchema = academicAtRiskStudentSchema.extend({
  offeringId: uuidSchema.nullable(),
  courseCode: z.string().nullable(),
})

export const lecturerNotificationSchema = academicNotificationSchema

export const lecturerRoomOptionSchema = z.object({
  id: uuidSchema,
  code: z.string(),
  name: z.string(),
  building: z.string().nullable(),
})

export const lecturerTimetableSlotSchema = lecturerScheduleItemSchema

export const saveLecturerTimetableSlotRequestSchema = z.object({
  offeringId: uuidSchema,
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  sessionType: z.enum(['Lecture', 'Tutorial', 'Lab', 'Practical']).default('Lecture'),
  roomId: uuidSchema.nullable().optional(),
})

export const updateLecturerTimetableSlotRequestSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  sessionType: z.enum(['Lecture', 'Tutorial', 'Lab', 'Practical']).optional(),
  roomId: uuidSchema.nullable().optional(),
})

export type LecturerProfile = z.infer<typeof lecturerProfileSchema>
export type LecturerDashboard = z.infer<typeof lecturerDashboardSchema>
export type LecturerCourseRow = z.infer<typeof lecturerCourseRowSchema>
export type LecturerCourseDetail = z.infer<typeof lecturerCourseDetailSchema>
export type LecturerAttendanceSession = z.infer<typeof lecturerAttendanceSessionSchema>
export type LecturerAttendanceDetail = z.infer<typeof lecturerAttendanceDetailSchema>
export type SaveLecturerAttendanceRequest = z.infer<typeof saveLecturerAttendanceRequestSchema>
export type LecturerResultBatch = z.infer<typeof lecturerResultBatchSchema>
export type SaveLecturerResultsRequest = z.infer<typeof saveLecturerResultsRequestSchema>
export type LecturerAssessmentRow = z.infer<typeof lecturerAssessmentRowSchema>
export type LecturerAssessmentDetail = z.infer<typeof lecturerAssessmentDetailSchema>
export type CreateLecturerAssessmentRequest = z.infer<typeof createLecturerAssessmentRequestSchema>
export type SaveLecturerGradeRequest = z.infer<typeof saveLecturerGradeRequestSchema>
export type LecturerAtRiskStudent = z.infer<typeof lecturerAtRiskStudentSchema>
export type LecturerNotification = z.infer<typeof lecturerNotificationSchema>
export type ResolveLecturerAtRiskRequest = z.infer<typeof resolveLecturerAtRiskRequestSchema>
export type LecturerRoomOption = z.infer<typeof lecturerRoomOptionSchema>
export type LecturerTimetableSlot = z.infer<typeof lecturerTimetableSlotSchema>
export type SaveLecturerTimetableSlotRequest = z.infer<typeof saveLecturerTimetableSlotRequestSchema>
export type UpdateLecturerTimetableSlotRequest = z.infer<typeof updateLecturerTimetableSlotRequestSchema>
