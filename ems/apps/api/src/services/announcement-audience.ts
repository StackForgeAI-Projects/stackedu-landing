import { and, eq, inArray, sql } from 'drizzle-orm'
import type { AnnouncementAudience, IctAudienceOptions, UserRole } from '@stackedu/shared'
import { userRoleSchema } from '@stackedu/shared/enums'
import { getInstitutionDb } from '../db/connection'
import { departments, programmes } from '../db/institution/schema/academic'
import { users } from '../db/institution/schema/people'
import { students } from '../db/institution/schema/students'

const ROLE_LABELS: Record<UserRole, string> = {
  Applicant: 'Applicants',
  Student: 'Students',
  Lecturer: 'Lecturers',
  Bursar: 'Bursars',
  AcademicAdmin: 'Academic admins',
  Librarian: 'Librarians',
  ICTManager: 'ICT managers',
}

export function encodeAudience(audience: AnnouncementAudience | undefined, fallbackRoles: string[] = []): string[] {
  if (!audience) return fallbackRoles
  if (audience.everyone) return ['*']

  const tokens = new Set<string>()
  for (const role of audience.roles ?? []) tokens.add(`role:${role}`)
  if (audience.includeEnrolledStudents) tokens.add('students')
  if (audience.includeApplicants) tokens.add('applicants')
  for (const id of audience.departmentIds ?? []) tokens.add(`dept:${id}`)
  for (const year of audience.yearsOfStudy ?? []) tokens.add(`year:${year}`)
  return tokens.size ? [...tokens] : ['none']
}

export function decodeAudience(tokens: string[]): AnnouncementAudience {
  if (tokens.includes('none')) {
    return { everyone: false, roles: [], includeEnrolledStudents: false, includeApplicants: false, departmentIds: [], yearsOfStudy: [] }
  }
  if (tokens.includes('*') || tokens.length === 0) return { everyone: true }

  const roles: UserRole[] = []
  const departmentIds: string[] = []
  const yearsOfStudy: number[] = []
  let includeEnrolledStudents = false
  let includeApplicants = false

  for (const token of tokens) {
    if (token === 'students') includeEnrolledStudents = true
    else if (token === 'applicants') includeApplicants = true
    else if (token.startsWith('role:')) {
      const key = token.slice(5)
      const parsed = userRoleSchema.safeParse(key)
      if (parsed.success) roles.push(parsed.data)
    } else if (token.startsWith('dept:')) departmentIds.push(token.slice(5))
    else if (token.startsWith('year:')) {
      const year = Number(token.slice(5))
      if (Number.isInteger(year)) yearsOfStudy.push(year)
    }
  }

  return {
    everyone: false,
    roles,
    includeEnrolledStudents,
    includeApplicants,
    departmentIds,
    yearsOfStudy,
  }
}

export async function audienceLabel(institutionId: string, tokens: string[]): Promise<string> {
  const audience = decodeAudience(tokens)
  if (audience.everyone || tokens.length === 0) return 'Everyone at the institution'

  const parts: string[] = []
  const roles = audience.roles ?? []
  const staffRoles = roles.filter((role) => role !== 'Student' && role !== 'Applicant')
  if (staffRoles.length) parts.push(staffRoles.map((role) => ROLE_LABELS[role]).join(', '))

  const studentFilters = Boolean((audience.departmentIds?.length ?? 0) || (audience.yearsOfStudy?.length ?? 0))
  const wantsStudents = audience.includeEnrolledStudents || roles.includes('Student') || studentFilters
  const wantsApplicants = audience.includeApplicants || roles.includes('Applicant')

  if (wantsStudents) {
    const studentBits = ['Enrolled students']
    if (audience.departmentIds?.length) {
      const db = await getInstitutionDb(institutionId)
      const rows = await db
        .select({ id: departments.id, name: departments.name })
        .from(departments)
        .where(inArray(departments.id, audience.departmentIds))
      const names = rows.map((row) => row.name)
      if (names.length) studentBits.push(`in ${names.join(', ')}`)
    }
    if (audience.yearsOfStudy?.length) {
      studentBits.push(`year ${audience.yearsOfStudy.sort((a, b) => a - b).join(', ')}`)
    }
    parts.push(studentBits.join(' · '))
  }

  if (wantsApplicants) parts.push('Applicants')
  return parts.join(' · ') || 'Selected users'
}

export async function resolveAudienceUserIds(
  institutionId: string,
  audience: AnnouncementAudience,
): Promise<string[]> {
  const db = await getInstitutionDb(institutionId)

  if (audience.everyone) {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true))
    return rows.map((row) => row.id)
  }

  const ids = new Set<string>()
  const roles = audience.roles ?? []
  const staffRoles = roles.filter((role) => role !== 'Student' && role !== 'Applicant')
  const studentFilters = Boolean((audience.departmentIds?.length ?? 0) || (audience.yearsOfStudy?.length ?? 0))
  const wantsStudents = audience.includeEnrolledStudents || roles.includes('Student') || studentFilters
  const wantsApplicants = audience.includeApplicants || roles.includes('Applicant')

  if (staffRoles.length) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.isActive, true), inArray(users.role, staffRoles)))
    for (const row of rows) ids.add(row.id)
  }

  if (wantsApplicants) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.isActive, true), eq(users.role, 'Applicant')))
    for (const row of rows) ids.add(row.id)
  }

  if (wantsStudents) {
    const conditions = [eq(users.isActive, true), eq(users.role, 'Student')]
    if (audience.departmentIds?.length) conditions.push(inArray(departments.id, audience.departmentIds))
    if (audience.yearsOfStudy?.length) conditions.push(inArray(students.yearOfStudy, audience.yearsOfStudy))

    const rows = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(students, eq(students.userId, users.id))
      .innerJoin(programmes, eq(programmes.id, students.programmeId))
      .innerJoin(departments, eq(departments.id, programmes.departmentId))
      .where(and(...conditions))

    for (const row of rows) ids.add(row.id)
  }

  return [...ids]
}

export async function listIctAudienceOptions(institutionId: string): Promise<IctAudienceOptions> {
  const db = await getInstitutionDb(institutionId)

  const roleRows = await db
    .select({
      role: users.role,
      userCount: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.role)

  const countByRole = new Map(roleRows.map((row) => [row.role, row.userCount]))
  const roles = userRoleSchema.options.map((key) => ({
    key,
    label: ROLE_LABELS[key],
    userCount: countByRole.get(key) ?? 0,
  }))

  const departmentRows = await db
    .select({
      id: departments.id,
      name: departments.name,
      studentCount: sql<number>`count(${students.id})::int`,
    })
    .from(departments)
    .leftJoin(programmes, eq(programmes.departmentId, departments.id))
    .leftJoin(students, eq(students.programmeId, programmes.id))
    .groupBy(departments.id, departments.name)
    .orderBy(departments.name)

  const yearRows = await db
    .select({
      year: students.yearOfStudy,
      studentCount: sql<number>`count(*)::int`,
    })
    .from(students)
    .groupBy(students.yearOfStudy)
    .orderBy(students.yearOfStudy)

  return {
    totalUsers: roleRows.reduce((sum, row) => sum + row.userCount, 0),
    enrolledStudentCount: countByRole.get('Student') ?? 0,
    applicantCount: countByRole.get('Applicant') ?? 0,
    roles,
    departments: departmentRows,
    years: yearRows,
  }
}
