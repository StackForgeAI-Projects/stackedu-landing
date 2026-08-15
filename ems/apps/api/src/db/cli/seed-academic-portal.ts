import { and, eq } from 'drizzle-orm'
import { academicCalendarEvents, academicYears, courses, semesters } from '../institution/schema/academic'
import { resultBatches, results } from '../institution/schema/assessment'
import { notifications } from '../institution/schema/communication'
import { riskFactors, riskScores } from '../institution/schema/ai'
import { users } from '../institution/schema/people'
import { enrolments, students } from '../institution/schema/students'
import {
  courseOfferings,
  lecturerAssignments,
  rooms,
  timetableSlots,
} from '../institution/schema/teaching'
import { getInstitutionDb } from '../connection'

/**
 * Demo data for the academic admin portal: calendar, pending results, risk
 * flags, and notifications. Idempotent — safe to run after seedStudentPortal.
 */
export async function seedAcademicPortal(
  institutionId: string,
  academicAdminUserId: string,
  lecturerUserId: string,
): Promise<void> {
  const db = await getInstitutionDb(institutionId)

  const [year] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.isCurrent, true))
    .limit(1)
  if (!year) return

  const [semester] = await db
    .select({ id: semesters.id, startDate: semesters.startDate, endDate: semesters.endDate })
    .from(semesters)
    .where(and(eq(semesters.academicYearId, year.id), eq(semesters.isCurrent, true)))
    .limit(1)
  if (!semester) return

  const calendarSpecs = [
    {
      title: 'Course Registration — Semester 1',
      category: 'Registration',
      startDate: semester.startDate,
      endDate: '2025-09-15',
      description: 'Students may register for Semester 1 courses within this window.',
    },
    {
      title: 'Mid-Semester Break',
      category: 'Holiday',
      startDate: '2025-10-28',
      endDate: '2025-11-01',
      description: 'No classes during this period.',
    },
    {
      title: 'Examination Period — Semester 1',
      category: 'Exam',
      startDate: '2025-12-02',
      endDate: '2025-12-15',
      description: 'End-of-semester examinations.',
    },
    {
      title: 'Results Release — Semester 1',
      category: 'Results',
      startDate: '2026-01-10',
      endDate: '2026-01-10',
      description: 'Approved results published to the student portal.',
    },
  ]

  for (const event of calendarSpecs) {
    const [exists] = await db
      .select({ id: academicCalendarEvents.id })
      .from(academicCalendarEvents)
      .where(
        and(
          eq(academicCalendarEvents.semesterId, semester.id),
          eq(academicCalendarEvents.title, event.title),
        ),
      )
      .limit(1)
    if (exists) continue
    await db.insert(academicCalendarEvents).values({
      semesterId: semester.id,
      title: event.title,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description,
      isPublished: true,
      createdBy: academicAdminUserId,
    })
  }

  const [secondOffering] = await db
    .select({
      offeringId: courseOfferings.id,
      courseCode: courses.code,
      courseName: courses.name,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(courseOfferings.semesterId, semester.id), eq(courses.code, 'CSC102')))
    .limit(1)

  if (secondOffering) {
    await db
      .insert(lecturerAssignments)
      .values({
        courseOfferingId: secondOffering.offeringId,
        lecturerId: lecturerUserId,
        isLead: true,
      })
      .onConflictDoNothing({
        target: [lecturerAssignments.courseOfferingId, lecturerAssignments.lecturerId],
      })

    const [existingBatch] = await db
      .select({ id: resultBatches.id })
      .from(resultBatches)
      .where(
        and(
          eq(resultBatches.courseOfferingId, secondOffering.offeringId),
          eq(resultBatches.status, 'PendingReview'),
        ),
      )
      .limit(1)

    let batchId = existingBatch?.id
    if (!batchId) {
      const [created] = await db
        .insert(resultBatches)
        .values({
          courseOfferingId: secondOffering.offeringId,
          semesterId: semester.id,
          status: 'PendingReview',
          submittedBy: lecturerUserId,
          submittedAt: new Date().toISOString(),
        })
        .returning({ id: resultBatches.id })
      batchId = created!.id
    }

    const [demoStudent] = await db
      .select({ id: students.id, studentNumber: students.studentNumber })
      .from(students)
      .innerJoin(users, eq(users.id, students.userId))
      .where(eq(users.email, 'student@sfu.ac.rw'))
      .limit(1)

    if (demoStudent && batchId) {
      await db
        .insert(results)
        .values({
          resultBatchId: batchId,
          studentId: demoStudent.id,
          courseOfferingId: secondOffering.offeringId,
          totalScore: '78.00',
          grade: 'B',
          gradePoint: '3.00',
          creditsEarned: 3,
          isPassed: true,
        })
        .onConflictDoNothing({ target: [results.studentId, results.courseOfferingId] })
    }
  }

  const [demoStudent] = await db
    .select({ id: students.id, studentNumber: students.studentNumber })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .where(eq(users.email, 'student@sfu.ac.rw'))
    .limit(1)

  if (demoStudent) {
    const [existingRisk] = await db
      .select({ id: riskScores.id })
      .from(riskScores)
      .where(and(eq(riskScores.studentId, demoStudent.id), eq(riskScores.semesterId, semester.id)))
      .limit(1)

    let riskScoreId = existingRisk?.id
    if (!riskScoreId) {
      const [created] = await db
        .insert(riskScores)
        .values({
          studentId: demoStudent.id,
          semesterId: semester.id,
          score: '62.50',
          level: 'Medium',
          confidence: '0.820',
          modelVersion: 'risk-v1-demo',
          computedAt: new Date().toISOString(),
        })
        .returning({ id: riskScores.id })
      riskScoreId = created!.id
    }

    if (riskScoreId) {
      const [hasFactors] = await db
        .select({ id: riskFactors.id })
        .from(riskFactors)
        .where(eq(riskFactors.riskScoreId, riskScoreId))
        .limit(1)

      if (!hasFactors) {
        await db.insert(riskFactors).values([
          {
            riskScoreId,
            factor: 'LowAttendance',
            contribution: '35.00',
            explanation: 'Attendance below 70% in registered courses',
          },
          {
            riskScoreId,
            factor: 'DecliningGrades',
            contribution: '27.50',
            explanation: 'GPA trend declining over the last assessment cycle',
          },
          {
            riskScoreId,
            factor: 'FeeArrears',
            contribution: '15.00',
            explanation: 'Outstanding fee balance on student account',
          },
        ])
      }
    }

    await db
      .insert(enrolments)
      .values({
        studentId: demoStudent.id,
        semesterId: semester.id,
        yearOfStudy: 1,
        status: 'Active',
        academicStanding: 'Good',
      })
      .onConflictDoNothing({ target: [enrolments.studentId, enrolments.semesterId] })
  }

  const [existingNotif] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.userId, academicAdminUserId))
    .limit(1)

  if (!existingNotif) {
    await db.insert(notifications).values([
      {
        userId: academicAdminUserId,
        title: 'Results submitted: CSC 102',
        body: 'Dr. Amina Uwase has submitted Programming Fundamentals results for review.',
        category: 'Results',
        actionUrl: '/academic/results',
      },
      {
        userId: academicAdminUserId,
        title: 'New application awaiting review',
        body: 'A new student application has been submitted and is ready for review.',
        category: 'Applications',
        actionUrl: '/academic/applications',
      },
      {
        userId: academicAdminUserId,
        title: 'At-risk student flagged',
        body: demoStudent
          ? `Student ${demoStudent.studentNumber} has been flagged as medium risk this semester.`
          : 'A student has been flagged as at-risk this semester.',
        category: 'At-Risk',
        actionUrl: '/academic/at-risk',
      },
      {
        userId: academicAdminUserId,
        title: 'Registration window reminder',
        body: 'Course registration for the current semester closes soon.',
        category: 'Registration',
        actionUrl: '/academic/calendar',
      },
    ])
  }

  const [offering] = await db
    .select({ id: courseOfferings.id })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .where(and(eq(courseOfferings.semesterId, semester.id), eq(courses.code, 'MTH101')))
    .limit(1)

  if (offering) {
    const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.code, 'HALLA')).limit(1)
    const [slotExists] = await db
      .select({ id: timetableSlots.id })
      .from(timetableSlots)
      .where(
        and(
          eq(timetableSlots.courseOfferingId, offering.id),
          eq(timetableSlots.dayOfWeek, 4),
          eq(timetableSlots.startTime, '14:00'),
        ),
      )
      .limit(1)

    if (!slotExists && room) {
      await db.insert(timetableSlots).values({
        courseOfferingId: offering.id,
        roomId: room.id,
        dayOfWeek: 4,
        startTime: '14:00',
        endTime: '16:00',
        sessionType: 'Tutorial',
      })
    }
  }

  process.stdout.write('Academic portal demo data ready\n')
}
