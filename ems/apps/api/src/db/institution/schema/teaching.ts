import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKeyColumn, timestamps } from '../../columns'
import { courses, semesters } from './academic'
import { attendanceStatusEnum, registrationStatusEnum } from './enums'
import { users } from './people'
import { students } from './students'

/**
 * Teaching and learning.
 *
 * A course is the catalogue entry; a course offering is that course actually
 * being run in a given semester. Registrations, timetables and attendance all
 * hang off the offering, not the catalogue entry.
 */

export const courseOfferings = pgTable(
  'course_offerings',
  {
    id: primaryKeyColumn(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    semesterId: uuid('semester_id')
      .notNull()
      .references(() => semesters.id, { onDelete: 'cascade' }),
    /** Lets an institution run two streams of the same course. */
    section: text('section').notNull().default('A'),
    capacity: integer('capacity'),
    enrolledCount: integer('enrolled_count').notNull().default(0),
    isOpenForRegistration: boolean('is_open_for_registration').notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('course_offerings_key').on(t.courseId, t.semesterId, t.section),
    index('course_offerings_semester_idx').on(t.semesterId),
  ],
)

export const lecturerAssignments = pgTable(
  'lecturer_assignments',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    lecturerId: uuid('lecturer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Lead lecturers can publish results; assistants cannot. */
    isLead: boolean('is_lead').notNull().default(true),
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('lecturer_assignments_key').on(t.courseOfferingId, t.lecturerId),
    index('lecturer_assignments_lecturer_idx').on(t.lecturerId),
  ],
)

export const courseRegistrations = pgTable(
  'course_registrations',
  {
    id: primaryKeyColumn(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    status: registrationStatusEnum('status').notNull().default('Pending'),
    registeredAt: timestamp('registered_at', { withTimezone: true, mode: 'string' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
    droppedAt: timestamp('dropped_at', { withTimezone: true, mode: 'string' }),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('course_registrations_key').on(t.studentId, t.courseOfferingId),
    index('course_registrations_offering_idx').on(t.courseOfferingId, t.status),
  ],
)

export const rooms = pgTable(
  'rooms',
  {
    id: primaryKeyColumn(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    building: text('building'),
    capacity: integer('capacity'),
    /** e.g. Lecture Hall, Laboratory, Studio. */
    roomType: text('room_type'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex('rooms_code_key').on(t.code)],
)

export const timetableSlots = pgTable(
  'timetable_slots',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    /** 1 = Monday through 7 = Sunday, matching ISO-8601. */
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    /** e.g. Lecture, Tutorial, Practical. */
    sessionType: text('session_type').notNull().default('Lecture'),
    ...timestamps(),
  },
  (t) => [
    index('timetable_slots_offering_idx').on(t.courseOfferingId),
    index('timetable_slots_room_day_idx').on(t.roomId, t.dayOfWeek),
  ],
)

export const attendanceSessions = pgTable(
  'attendance_sessions',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    sessionDate: date('session_date').notNull(),
    startTime: time('start_time'),
    endTime: time('end_time'),
    topic: text('topic'),
    takenBy: uuid('taken_by').references(() => users.id, { onDelete: 'set null' }),
    /** Attendance can be edited until it is closed, then it is final. */
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('attendance_sessions_key').on(t.courseOfferingId, t.sessionDate, t.startTime),
    index('attendance_sessions_date_idx').on(t.sessionDate),
  ],
)

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: primaryKeyColumn(),
    attendanceSessionId: uuid('attendance_session_id')
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull().default('Absent'),
    note: text('note'),
    recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('attendance_records_key').on(t.attendanceSessionId, t.studentId),
    index('attendance_records_student_idx').on(t.studentId),
  ],
)

export const courseMaterials = pgTable(
  'course_materials',
  {
    id: primaryKeyColumn(),
    courseOfferingId: uuid('course_offering_id')
      .notNull()
      .references(() => courseOfferings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    /** Groups materials into weeks or units within the course. */
    moduleName: text('module_name'),
    fileKey: text('file_key'),
    externalUrl: text('external_url'),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: text('mime_type'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    downloadCount: integer('download_count').notNull().default(0),
    ...timestamps(),
  },
  (t) => [index('course_materials_offering_idx').on(t.courseOfferingId, t.isPublished)],
)

export const announcements = pgTable(
  'announcements',
  {
    id: primaryKeyColumn(),
    /** Null means the announcement is institution-wide. */
    courseOfferingId: uuid('course_offering_id').references(() => courseOfferings.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** Roles this announcement is aimed at; empty means everyone. */
    audienceRoles: text('audience_roles').array().notNull().default([]),
    isPinned: boolean('is_pinned').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [
    index('announcements_offering_idx').on(t.courseOfferingId),
    index('announcements_published_idx').on(t.publishedAt),
  ],
)
