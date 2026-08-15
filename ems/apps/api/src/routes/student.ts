import { Hono } from 'hono'
import {
  registerCoursesRequestSchema,
  saveOnboardingRequestSchema,
  studentPayRequestSchema,
  submitAssessmentRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, requireRole, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  getRegistrationState,
  getStudentCourse,
  getStudentDashboard,
  getStudentFees,
  getStudentOnboarding,
  getStudentProfile,
  getStudentReceipt,
  getStudentResults,
  getStudentTranscript,
  listStudentAssessments,
  listStudentCourses,
  listStudentLibrary,
  listStudentNotifications,
  markNotificationRead,
  payStudentFees,
  registerForCourses,
  saveStudentOnboarding,
  submitStudentAssessment,
} from '../services/student'

type Variables = RequestVariables & Partial<AuthVariables>

export const studentRoutes = new Hono<{ Variables: Variables }>()

const studentOnly = [requireAuth, requireRole('Student')] as const

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

studentRoutes.get('/student/me', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getStudentProfile(user.institution.id, user.id) })
})

studentRoutes.get('/student/dashboard', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ dashboard: await getStudentDashboard(user.institution.id, user.id) })
})

studentRoutes.get('/student/courses', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json(await listStudentCourses(user.institution.id, user.id))
})

studentRoutes.get('/student/courses/:offeringId', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    course: await getStudentCourse(user.institution.id, user.id, c.req.param('offeringId')),
  })
})

studentRoutes.get('/student/registration', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ registration: await getRegistrationState(user.institution.id, user.id) })
})

studentRoutes.post('/student/registration', ...studentOnly, async (c) => {
  const parsed = registerCoursesRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    registration: await registerForCourses(user.institution.id, user.id, parsed.data),
  })
})

studentRoutes.get('/student/results', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ results: await getStudentResults(user.institution.id, user.id) })
})

studentRoutes.get('/student/transcript', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ transcript: await getStudentTranscript(user.institution.id, user.id) })
})

studentRoutes.get('/student/fees', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ fees: await getStudentFees(user.institution.id, user.id) })
})

studentRoutes.post('/student/fees/pay', ...studentOnly, async (c) => {
  const parsed = studentPayRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ fees: await payStudentFees(user.institution.id, user.id, parsed.data) })
})

studentRoutes.get('/student/payments/:paymentId/receipt', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    receipt: await getStudentReceipt(user.institution.id, user.id, c.req.param('paymentId')),
  })
})

studentRoutes.get('/student/notifications', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await listStudentNotifications(user.institution.id, user.id),
  })
})

studentRoutes.post('/student/notifications/:id/read', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({
    notifications: await markNotificationRead(user.institution.id, user.id, c.req.param('id')),
  })
})

studentRoutes.get('/student/library', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ resources: await listStudentLibrary(user.institution.id, user.id) })
})

studentRoutes.get('/student/onboarding', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ onboarding: await getStudentOnboarding(user.institution.id, user.id) })
})

studentRoutes.patch('/student/onboarding', ...studentOnly, async (c) => {
  const parsed = saveOnboardingRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    onboarding: await saveStudentOnboarding(user.institution.id, user.id, parsed.data),
  })
})

studentRoutes.get('/student/assessments', ...studentOnly, async (c) => {
  const user = c.get('user')!
  return c.json({ assessments: await listStudentAssessments(user.institution.id, user.id) })
})

studentRoutes.post('/student/assessments/:id/submit', ...studentOnly, async (c) => {
  const parsed = submitAssessmentRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({
    assessments: await submitStudentAssessment(
      user.institution.id,
      user.id,
      c.req.param('id'),
      parsed.data,
    ),
  })
})
