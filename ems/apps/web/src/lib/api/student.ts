import type {
  StudentAssessment,
  StudentCourseDetail,
  StudentDashboard,
  StudentFees,
  StudentLibraryResource,
  StudentNotification,
  StudentOnboarding,
  StudentProfile,
  StudentReceipt,
  StudentRegistrationState,
  StudentResults,
  StudentTranscript,
  PaymentMethod,
} from '@stackedu/shared'
import { api } from './client'

export const studentProfileQueryKey = ['student', 'me'] as const
export const studentDashboardQueryKey = ['student', 'dashboard'] as const
export const studentCoursesQueryKey = ['student', 'courses'] as const
export const studentCourseQueryKey = (id: string) => ['student', 'course', id] as const
export const studentRegistrationQueryKey = ['student', 'registration'] as const
export const studentResultsQueryKey = ['student', 'results'] as const
export const studentTranscriptQueryKey = ['student', 'transcript'] as const
export const studentFeesQueryKey = ['student', 'fees'] as const
export const studentNotificationsQueryKey = ['student', 'notifications'] as const
export const studentLibraryQueryKey = ['student', 'library'] as const
export const studentOnboardingQueryKey = ['student', 'onboarding'] as const
export const studentAssessmentsQueryKey = ['student', 'assessments'] as const

export async function getStudentProfile(): Promise<StudentProfile> {
  const { profile } = await api.get<{ profile: StudentProfile }>('/student/me')
  return profile
}

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const { dashboard } = await api.get<{ dashboard: StudentDashboard }>('/student/dashboard')
  return dashboard
}

export async function getStudentCourses() {
  return api.get<{
    semester: { id: string; label: string } | null
    courses: StudentDashboard['courses']
  }>('/student/courses')
}

export async function getStudentCourse(offeringId: string): Promise<StudentCourseDetail> {
  const { course } = await api.get<{ course: StudentCourseDetail }>(
    `/student/courses/${offeringId}`,
  )
  return course
}

export async function getStudentRegistration(): Promise<StudentRegistrationState> {
  const { registration } = await api.get<{ registration: StudentRegistrationState }>(
    '/student/registration',
  )
  return registration
}

export async function registerStudentCourses(offeringIds: string[]) {
  const { registration } = await api.post<{ registration: StudentRegistrationState }>(
    '/student/registration',
    { offeringIds },
  )
  return registration
}

export async function getStudentResults(): Promise<StudentResults> {
  const { results } = await api.get<{ results: StudentResults }>('/student/results')
  return results
}

export async function getStudentTranscript(): Promise<StudentTranscript> {
  const { transcript } = await api.get<{ transcript: StudentTranscript }>('/student/transcript')
  return transcript
}

export async function getStudentFees(): Promise<StudentFees> {
  const { fees } = await api.get<{ fees: StudentFees }>('/student/fees')
  return fees
}

export async function payStudentFees(input: {
  invoiceId?: string
  amount: number
  method: PaymentMethod
  payerPhone?: string
}) {
  const { fees } = await api.post<{ fees: StudentFees }>('/student/fees/pay', input)
  return fees
}

export async function getStudentReceipt(paymentId: string): Promise<StudentReceipt> {
  const { receipt } = await api.get<{ receipt: StudentReceipt }>(
    `/student/payments/${paymentId}/receipt`,
  )
  return receipt
}

export async function getStudentNotifications(): Promise<StudentNotification[]> {
  const { notifications } = await api.get<{ notifications: StudentNotification[] }>(
    '/student/notifications',
  )
  return notifications
}

export async function markStudentNotificationRead(id: string) {
  const { notifications } = await api.post<{ notifications: StudentNotification[] }>(
    `/student/notifications/${id}/read`,
  )
  return notifications
}

export async function getStudentLibrary(): Promise<StudentLibraryResource[]> {
  const { resources } = await api.get<{ resources: StudentLibraryResource[] }>('/student/library')
  return resources
}

export async function getStudentOnboarding(): Promise<StudentOnboarding> {
  const { onboarding } = await api.get<{ onboarding: StudentOnboarding }>('/student/onboarding')
  return onboarding
}

export async function saveStudentOnboarding(input: {
  completedSteps: string[]
  currentStep?: string | null
  complete?: boolean
}) {
  const { onboarding } = await api.patch<{ onboarding: StudentOnboarding }>(
    '/student/onboarding',
    input,
  )
  return onboarding
}

export async function getStudentAssessments(): Promise<StudentAssessment[]> {
  const { assessments } = await api.get<{ assessments: StudentAssessment[] }>(
    '/student/assessments',
  )
  return assessments
}

export async function submitStudentAssessment(id: string, textResponse: string) {
  const { assessments } = await api.post<{ assessments: StudentAssessment[] }>(
    `/student/assessments/${id}/submit`,
    { textResponse },
  )
  return assessments
}
