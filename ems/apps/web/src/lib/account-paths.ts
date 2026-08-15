import type { UserRole } from '@stackedu/shared'

const ROLE_SEGMENTS: Record<string, UserRole> = {
  apply: 'Applicant',
  student: 'Student',
  lecturer: 'Lecturer',
  bursar: 'Bursar',
  academic: 'AcademicAdmin',
  librarian: 'Librarian',
  ict: 'ICTManager',
}

export function roleSegmentFromPath(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] || 'student'
}

export function profilePath(pathname: string): string {
  return `/${roleSegmentFromPath(pathname)}/profile`
}

/** ICT System Settings already occupy /ict/settings. */
export function accountSettingsPath(pathname: string): string {
  const segment = roleSegmentFromPath(pathname)
  return segment === 'ict' ? '/ict/account-settings' : `/${segment}/settings`
}

export function roleFromSegment(segment: string): UserRole | null {
  return ROLE_SEGMENTS[segment] ?? null
}
