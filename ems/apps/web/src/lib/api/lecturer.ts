import type {
  CreateLecturerAssessmentRequest,
  LecturerAssessmentDetail,
  LecturerAssessmentRow,
  LecturerAttendanceDetail,
  LecturerAttendanceSession,
  LecturerAtRiskStudent,
  LecturerCourseDetail,
  LecturerCourseRow,
  LecturerDashboard,
  LecturerNotification,
  LecturerProfile,
  LecturerResultBatch,
  LecturerRoomOption,
  LecturerTimetableSlot,
  ResolveLecturerAtRiskRequest,
  SaveLecturerAttendanceRequest,
  SaveLecturerGradeRequest,
  SaveLecturerResultsRequest,
  SaveLecturerTimetableSlotRequest,
  UpdateLecturerTimetableSlotRequest,
} from '@stackedu/shared'
import { api } from './client'

export const lecturerProfileQueryKey = ['lecturer', 'me'] as const
export const lecturerDashboardQueryKey = ['lecturer', 'dashboard'] as const
export const lecturerCoursesQueryKey = ['lecturer', 'courses'] as const
export const lecturerCourseQueryKey = (id: string) => ['lecturer', 'course', id] as const
export const lecturerAttendanceQueryKey = (offeringId?: string) =>
  ['lecturer', 'attendance', offeringId ?? 'all'] as const
export const lecturerAttendanceSessionQueryKey = (id: string) => ['lecturer', 'attendance-session', id] as const
export const lecturerResultsQueryKey = (offeringId: string) => ['lecturer', 'results', offeringId] as const
export const lecturerAssessmentsQueryKey = (offeringId?: string) =>
  ['lecturer', 'assessments', offeringId ?? 'all'] as const
export const lecturerAssessmentQueryKey = (id: string) => ['lecturer', 'assessment', id] as const
export const lecturerAtRiskQueryKey = ['lecturer', 'at-risk'] as const
export const lecturerNotificationsQueryKey = ['lecturer', 'notifications'] as const
export const lecturerTimetableQueryKey = ['lecturer', 'timetable'] as const
export const lecturerRoomsQueryKey = ['lecturer', 'rooms'] as const

export async function getLecturerProfile(): Promise<LecturerProfile> {
  const { profile } = await api.get<{ profile: LecturerProfile }>('/lecturer/me')
  return profile
}

export async function getLecturerDashboard(): Promise<LecturerDashboard> {
  const { dashboard } = await api.get<{ dashboard: LecturerDashboard }>('/lecturer/dashboard')
  return dashboard
}

export async function listLecturerCourses(): Promise<LecturerCourseRow[]> {
  const { courses } = await api.get<{ courses: LecturerCourseRow[] }>('/lecturer/courses')
  return courses
}

export async function getLecturerCourse(offeringId: string): Promise<LecturerCourseDetail> {
  const { course } = await api.get<{ course: LecturerCourseDetail }>(`/lecturer/courses/${offeringId}`)
  return course
}

export async function listLecturerAttendance(offeringId?: string): Promise<LecturerAttendanceSession[]> {
  const query = offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : ''
  const { sessions } = await api.get<{ sessions: LecturerAttendanceSession[] }>(`/lecturer/attendance${query}`)
  return sessions
}

export async function getLecturerAttendanceSession(sessionId: string): Promise<LecturerAttendanceDetail> {
  const { session } = await api.get<{ session: LecturerAttendanceDetail }>(`/lecturer/attendance/${sessionId}`)
  return session
}

export async function saveLecturerAttendance(
  input: SaveLecturerAttendanceRequest,
): Promise<LecturerAttendanceDetail> {
  const { session } = await api.post<{ session: LecturerAttendanceDetail }>('/lecturer/attendance', input)
  return session
}

export async function deleteLecturerAttendanceSession(sessionId: string): Promise<LecturerAttendanceSession[]> {
  const { sessions } = await api.delete<{ sessions: LecturerAttendanceSession[] }>(
    `/lecturer/attendance/${sessionId}`,
  )
  return sessions
}

export async function getLecturerResults(offeringId: string): Promise<LecturerResultBatch> {
  const { results } = await api.get<{ results: LecturerResultBatch }>(`/lecturer/results/${offeringId}`)
  return results
}

export async function saveLecturerResults(
  offeringId: string,
  input: SaveLecturerResultsRequest,
): Promise<LecturerResultBatch> {
  const { results } = await api.patch<{ results: LecturerResultBatch }>(`/lecturer/results/${offeringId}`, input)
  return results
}

export async function submitLecturerResults(offeringId: string): Promise<LecturerResultBatch> {
  const { results } = await api.post<{ results: LecturerResultBatch }>(
    `/lecturer/results/${offeringId}/submit`,
    {},
  )
  return results
}

export async function listLecturerAssessments(offeringId?: string): Promise<LecturerAssessmentRow[]> {
  const query = offeringId ? `?offeringId=${encodeURIComponent(offeringId)}` : ''
  const { assessments } = await api.get<{ assessments: LecturerAssessmentRow[] }>(
    `/lecturer/assessments${query}`,
  )
  return assessments
}

export async function createLecturerAssessment(
  input: CreateLecturerAssessmentRequest,
): Promise<LecturerAssessmentRow> {
  const { assessment } = await api.post<{ assessment: LecturerAssessmentRow }>('/lecturer/assessments', input)
  return assessment
}

export async function getLecturerAssessment(id: string): Promise<LecturerAssessmentDetail> {
  const { assessment } = await api.get<{ assessment: LecturerAssessmentDetail }>(`/lecturer/assessments/${id}`)
  return assessment
}

export async function saveLecturerGrade(
  assessmentId: string,
  input: SaveLecturerGradeRequest,
): Promise<LecturerAssessmentDetail> {
  const { assessment } = await api.post<{ assessment: LecturerAssessmentDetail }>(
    `/lecturer/assessments/${assessmentId}/grades`,
    input,
  )
  return assessment
}

export async function listLecturerAtRiskStudents(): Promise<LecturerAtRiskStudent[]> {
  const { students } = await api.get<{ students: LecturerAtRiskStudent[] }>('/lecturer/at-risk')
  return students
}

export async function resolveLecturerAtRisk(
  id: string,
  input: ResolveLecturerAtRiskRequest,
): Promise<LecturerAtRiskStudent[]> {
  const { students } = await api.post<{ students: LecturerAtRiskStudent[] }>(
    `/lecturer/at-risk/${id}/resolve`,
    input,
  )
  return students
}

export async function listLecturerNotifications(): Promise<LecturerNotification[]> {
  const { notifications } = await api.get<{ notifications: LecturerNotification[] }>('/lecturer/notifications')
  return notifications
}

export async function markLecturerNotificationRead(id: string): Promise<LecturerNotification[]> {
  const { notifications } = await api.post<{ notifications: LecturerNotification[] }>(
    `/lecturer/notifications/${id}/read`,
    {},
  )
  return notifications
}

export async function markAllLecturerNotificationsRead(): Promise<LecturerNotification[]> {
  const { notifications } = await api.post<{ notifications: LecturerNotification[] }>(
    '/lecturer/notifications/read-all',
    {},
  )
  return notifications
}

export async function listLecturerTimetableSlots(): Promise<LecturerTimetableSlot[]> {
  const { slots } = await api.get<{ slots: LecturerTimetableSlot[] }>('/lecturer/timetable')
  return slots
}

export async function listLecturerRooms(): Promise<LecturerRoomOption[]> {
  const { rooms } = await api.get<{ rooms: LecturerRoomOption[] }>('/lecturer/rooms')
  return rooms
}

export async function createLecturerTimetableSlot(
  input: SaveLecturerTimetableSlotRequest,
): Promise<LecturerTimetableSlot> {
  const { slot } = await api.post<{ slot: LecturerTimetableSlot }>('/lecturer/timetable', input)
  return slot
}

export async function updateLecturerTimetableSlot(
  slotId: string,
  input: UpdateLecturerTimetableSlotRequest,
): Promise<LecturerTimetableSlot> {
  const { slot } = await api.patch<{ slot: LecturerTimetableSlot }>(`/lecturer/timetable/${slotId}`, input)
  return slot
}

export async function deleteLecturerTimetableSlot(slotId: string): Promise<LecturerTimetableSlot[]> {
  const { slots } = await api.delete<{ slots: LecturerTimetableSlot[] }>(`/lecturer/timetable/${slotId}`)
  return slots
}
