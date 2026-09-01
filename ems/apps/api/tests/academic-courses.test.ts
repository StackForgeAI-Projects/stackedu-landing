import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { LECTURER_ASSIGNMENT_REQUIRES_SEMESTER } from '@stackedu/shared'
import { getInstitutionDb } from '../src/db/connection'
import { provisionInstitution } from '../src/db/provision'
import { academicYears, courses, departments, faculties, semesters } from '../src/db/institution/schema/academic'
import { AppError } from '../src/lib/errors'
import { createAcademicCourse, deleteAcademicCourse } from '../src/services/academic'
import { createUser } from '../src/services/users'
import { createTestPlatform, uniqueSlug, type TestPlatform } from './helpers/test-database'

describe('academic courses', () => {
  let platform: TestPlatform
  let institutionId: string
  let actor: { id: string; email: string; role: 'AcademicAdmin' }
  let lecturerId: string
  let semesterId: string

  beforeAll(async () => {
    platform = await createTestPlatform()

    const institution = await provisionInstitution({
      name: 'Course Test University',
      slug: uniqueSlug('courses'),
      shortName: 'CTU',
      contactEmail: 'registrar@courses.test',
    })
    institutionId = institution.institutionId

    const admin = await createUser({
      institutionId,
      email: 'admin@courses.test',
      fullName: 'Course Admin',
      role: 'AcademicAdmin',
      password: 'Correct#Horse2026',
    })
    actor = { id: admin.id, email: admin.email, role: 'AcademicAdmin' }

    const lecturer = await createUser({
      institutionId,
      email: 'lecturer@courses.test',
      fullName: 'Course Lecturer',
      role: 'Lecturer',
      password: 'Correct#Horse2026',
    })
    lecturerId = lecturer.id

    const db = await getInstitutionDb(institutionId)
    const [faculty] = await db.insert(faculties).values({ code: 'SCI', name: 'Science' }).returning({ id: faculties.id })
    await db.insert(departments).values({
      facultyId: faculty!.id,
      code: 'CMP',
      name: 'Department of Computing',
    })

    const [year] = await db
      .insert(academicYears)
      .values({ name: '2026/2027', startDate: '2026-09-01', endDate: '2027-08-31', isCurrent: true })
      .returning({ id: academicYears.id })
    const [semester] = await db
      .insert(semesters)
      .values({
        academicYearId: year!.id,
        name: 'Semester 1',
        sequence: 1,
        startDate: '2026-09-01',
        endDate: '2027-01-31',
        isCurrent: true,
        status: 'Open',
      })
      .returning({ id: semesters.id })
    semesterId = semester!.id
  })

  afterAll(async () => {
    await platform.cleanup()
  })

  it('creates a catalogue course without a lecturer or semester', async () => {
    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP101',
      name: 'Intro to Computing',
      departmentName: 'Department of Computing',
      credits: 3,
    })

    expect(created.code).toBe('CMP 101')

    const db = await getInstitutionDb(institutionId)
    const [row] = await db.select({ id: courses.id }).from(courses).where(eq(courses.code, 'CMP101'))
    expect(row?.id).toBe(created.id)
  })

  it('does not create a course when a lecturer is assigned without a semester', async () => {
    const error = await createAcademicCourse(institutionId, actor, {
      code: 'CMP102',
      name: 'Data Structures',
      departmentName: 'Department of Computing',
      credits: 4,
      lecturerId,
    }).catch((cause: AppError) => cause)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).message).toBe(LECTURER_ASSIGNMENT_REQUIRES_SEMESTER)

    const db = await getInstitutionDb(institutionId)
    const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.code, 'CMP102'))
    expect(rows).toHaveLength(0)
  })

  it('creates a course with a lecturer when a semester is selected', async () => {
    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP103',
      name: 'Algorithms',
      departmentName: 'Department of Computing',
      credits: 4,
      lecturerId,
      semesterId,
    })

    expect(created.lecturerId).toBe(lecturerId)
  })

  it('lets an academic admin delete a course with no enrolments', async () => {
    const created = await createAcademicCourse(institutionId, actor, {
      code: 'CMP104',
      name: 'Temporary Course',
      departmentName: 'Department of Computing',
      credits: 2,
    })

    await deleteAcademicCourse(institutionId, actor, created.id)

    const db = await getInstitutionDb(institutionId)
    const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, created.id))
    expect(rows).toHaveLength(0)
  })
})
