import { Hono } from 'hono'
import {
  createLecturerAssessmentRequestSchema,
  resolveLecturerAtRiskRequestSchema,
  saveLecturerAttendanceRequestSchema,
  saveLecturerGradeRequestSchema,
  saveLecturerResultsRequestSchema,
  saveLecturerTimetableSlotRequestSchema,
  updateLecturerTimetableSlotRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  createLecturerAssessment,
  createLecturerTimetableSlot,
  deleteLecturerTimetableSlot,
  getLecturerAssessment,
  getLecturerAttendanceSession,
  getLecturerCourse,
  getLecturerDashboard,
  getLecturerProfile,
  getLecturerResults,
  listLecturerAssessments,
  listLecturerAtRiskStudents,
  listLecturerAttendance,
  listLecturerCourses,
  listLecturerNotifications,
  listLecturerRooms,
  listLecturerTimetableSlots,
  markAllLecturerNotificationsRead,
  markLecturerNotificationRead,
  resolveLecturerAtRisk,
  saveLecturerAttendance,
  saveLecturerGrade,
  saveLecturerResults,
  updateLecturerTimetableSlot,
  submitLecturerResults,
} from '../services/lecturer'

type Variables = RequestVariables & Partial<AuthVariables>

export const lecturerRoutes = new Hono<{ Variables: Variables }>()

const lecturerOnly = [requireAuth, requireRole('Lecturer')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

function actor(c: { get: (key: 'user') => AuthVariables['user'] | undefined }) {
  const user = c.get('user')!
  return { id: user.id, email: user.email, role: user.role }
}

lecturerRoutes.get('/lecturer/me', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getLecturerProfile(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/dashboard', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getLecturerDashboard(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/courses', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ courses: await listLecturerCourses(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/courses/:offeringId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    course: await getLecturerCourse(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

lecturerRoutes.get('/lecturer/attendance', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    sessions: await listLecturerAttendance(user.institution.id, user.id, c.req.query('offeringId')),
  })
})

lecturerRoutes.get('/lecturer/attendance/:sessionId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    session: await getLecturerAttendanceSession(user.institution.id, user.id, c.req.param('sessionId')),
  })
})

lecturerRoutes.post('/lecturer/attendance', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerAttendanceRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    session: await saveLecturerAttendance(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.get('/lecturer/results/:offeringId', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    results: await getLecturerResults(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

lecturerRoutes.patch('/lecturer/results/:offeringId', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerResultsRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    results: await saveLecturerResults(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('offeringId'),
      parsed.data,
    ),
  })
})

lecturerRoutes.post('/lecturer/results/:offeringId/submit', ...lecturerOnly, async (c) => {
  return c.json({
    results: await submitLecturerResults(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('offeringId'),
    ),
  })
})

lecturerRoutes.get('/lecturer/assessments', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    assessments: await listLecturerAssessments(user.institution.id, user.id, c.req.query('offeringId')),
  })
})

lecturerRoutes.post('/lecturer/assessments', ...lecturerOnly, async (c) => {
  const parsed = createLecturerAssessmentRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    assessment: await createLecturerAssessment(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.get('/lecturer/assessments/:id', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    assessment: await getLecturerAssessment(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.post('/lecturer/assessments/:id/grades', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerGradeRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    assessment: await saveLecturerGrade(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/at-risk', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ students: await listLecturerAtRiskStudents(user.institution.id, user.id) })
})

lecturerRoutes.post('/lecturer/at-risk/:id/resolve', ...lecturerOnly, async (c) => {
  const parsed = resolveLecturerAtRiskRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    students: await resolveLecturerAtRisk(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('id'),
      parsed.data,
    ),
  })
})

lecturerRoutes.get('/lecturer/notifications', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ notifications: await listLecturerNotifications(user.institution.id, user.id) })
})

lecturerRoutes.post('/lecturer/notifications/read-all', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markAllLecturerNotificationsRead(user.institution.id, user.id),
  })
})

lecturerRoutes.post('/lecturer/notifications/:id/read', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markLecturerNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})

lecturerRoutes.get('/lecturer/timetable', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ slots: await listLecturerTimetableSlots(user.institution.id, user.id) })
})

lecturerRoutes.get('/lecturer/rooms', ...lecturerOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ rooms: await listLecturerRooms(user.institution.id, user.id) })
})

lecturerRoutes.post('/lecturer/timetable', ...lecturerOnly, async (c) => {
  const parsed = saveLecturerTimetableSlotRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    slot: await createLecturerTimetableSlot(c.get('user')!.institution.id, actor(c), parsed.data),
  })
})

lecturerRoutes.patch('/lecturer/timetable/:slotId', ...lecturerOnly, async (c) => {
  const parsed = updateLecturerTimetableSlotRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  return c.json({
    slot: await updateLecturerTimetableSlot(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('slotId'),
      parsed.data,
    ),
  })
})

lecturerRoutes.delete('/lecturer/timetable/:slotId', ...lecturerOnly, async (c) => {
  return c.json({
    slots: await deleteLecturerTimetableSlot(
      c.get('user')!.institution.id,
      actor(c),
      c.req.param('slotId'),
    ),
  })
})
