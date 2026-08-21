import { eq, sql } from 'drizzle-orm'
import type { ApplicationAdmissionOffer } from '@stackedu/shared'
import { getInstitutionDb, getPlatformDb } from '../db/connection'
import {
  admissionOffers,
  applications,
} from '../db/institution/schema/admissions'
import { users } from '../db/institution/schema/people'
import { studentProfiles, students } from '../db/institution/schema/students'
import { institutions, userDirectory } from '../db/platform/schema'
import { badRequest, conflict, notFound } from '../lib/errors'
import { notifyAdmissionOfferDeclined, notifyStudentWelcome } from '../lib/admissions-email'

const OFFER_VALID_DAYS = 30

async function nextStudentNumber(institutionId: string): Promise<string> {
  const [profile] = await getPlatformDb()
    .select({ shortName: institutions.shortName })
    .from(institutions)
    .where(eq(institutions.id, institutionId))
    .limit(1)

  const prefix = `${profile?.shortName ?? 'INS'}-${new Date().getFullYear()}-`
  const db = await getInstitutionDb(institutionId)
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(students)
  return `${prefix}${String((row?.count ?? 0) + 1).padStart(4, '0')}`
}

export async function loadAdmissionOffer(
  institutionId: string,
  applicationId: string,
): Promise<ApplicationAdmissionOffer | null> {
  const db = await getInstitutionDb(institutionId)
  const [offer] = await db
    .select({
      expiresAt: admissionOffers.expiresAt,
      acceptedAt: admissionOffers.acceptedAt,
      declinedAt: admissionOffers.declinedAt,
    })
    .from(admissionOffers)
    .where(eq(admissionOffers.applicationId, applicationId))
    .limit(1)

  return offer ?? null
}

export async function createAdmissionOffer(input: {
  institutionId: string
  applicationId: string
  programmeId: string
  issuedBy: string
}): Promise<void> {
  const db = await getInstitutionDb(input.institutionId)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + OFFER_VALID_DAYS)

  await db
    .insert(admissionOffers)
    .values({
      applicationId: input.applicationId,
      programmeId: input.programmeId,
      expiresAt: expiresAt.toISOString(),
      issuedBy: input.issuedBy,
    })
    .onConflictDoUpdate({
      target: admissionOffers.applicationId,
      set: {
        programmeId: input.programmeId,
        expiresAt: expiresAt.toISOString(),
        acceptedAt: null,
        declinedAt: null,
        issuedBy: input.issuedBy,
      },
    })
}

/** Applicant accepts an admission offer and becomes a registered student. */
export async function acceptAdmissionOffer(
  institutionId: string,
  applicantUserId: string,
): Promise<{ studentNumber: string }> {
  const db = await getInstitutionDb(institutionId)

  const [application] = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      status: applications.status,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      dateOfBirth: applications.dateOfBirth,
      gender: applications.gender,
      nationalId: applications.nationalId,
    })
    .from(applications)
    .where(eq(applications.applicantUserId, applicantUserId))
    .limit(1)

  if (!application) throw notFound('Your application')
  const fullName = [application.firstName, application.lastName].filter(Boolean).join(' ')

  if (application.status !== 'Accepted') {
    throw badRequest('No admission offer is waiting for you.')
  }

  const [offer] = await db
    .select({
      id: admissionOffers.id,
      acceptedAt: admissionOffers.acceptedAt,
      declinedAt: admissionOffers.declinedAt,
      expiresAt: admissionOffers.expiresAt,
      programmeId: admissionOffers.programmeId,
    })
    .from(admissionOffers)
    .where(eq(admissionOffers.applicationId, application.id))
    .limit(1)

  if (!offer) throw badRequest('No admission offer is waiting for you.')
  if (offer.acceptedAt) throw conflict('You have already accepted this admission offer.')
  if (offer.declinedAt) throw conflict('You have already declined this admission offer.')
  if (new Date(offer.expiresAt).getTime() <= Date.now()) {
    throw badRequest('This admission offer has expired. Contact the admissions office.')
  }

  const [existingStudent] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, applicantUserId))
    .limit(1)

  if (existingStudent) {
    throw conflict('You are already registered as a student.')
  }

  const studentNumber = await nextStudentNumber(institutionId)
  const now = new Date().toISOString()
  const admittedOn = now.slice(0, 10)

  await db.transaction(async (tx) => {
    await tx
      .update(admissionOffers)
      .set({ acceptedAt: now })
      .where(eq(admissionOffers.id, offer.id))

    const [student] = await tx
      .insert(students)
      .values({
        userId: applicantUserId,
        studentNumber,
        programmeId: offer.programmeId,
        yearOfStudy: 1,
        enrolmentStatus: 'Active',
        admittedAt: admittedOn,
      })
      .returning({ id: students.id })

    await tx.insert(studentProfiles).values({
      studentId: student!.id,
      firstName: fullName.split(/\s+/)[0] ?? fullName,
      lastName: fullName.split(/\s+/).slice(1).join(' ') || fullName,
      dateOfBirth: application.dateOfBirth,
      gender: application.gender,
      nationalId: application.nationalId,
      contactPhone: application.phone,
    })

    await tx
      .update(applications)
      .set({ convertedStudentId: student!.id })
      .where(eq(applications.id, application.id))

    await tx.update(users).set({ role: 'Student' }).where(eq(users.id, applicantUserId))
  })

  await getPlatformDb()
    .update(userDirectory)
    .set({ role: 'Student', alternateIdentifier: studentNumber })
    .where(eq(userDirectory.institutionUserId, applicantUserId))

  void notifyStudentWelcome({
    institutionId,
    to: application.email,
    fullName,
    reference: application.reference,
    studentNumber,
  })

  return { studentNumber }
}

/** Applicant declines an admission offer. They remain an applicant and are signed out. */
export async function declineAdmissionOffer(
  institutionId: string,
  applicantUserId: string,
): Promise<{ reference: string }> {
  const db = await getInstitutionDb(institutionId)

  const [application] = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      status: applications.status,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
    })
    .from(applications)
    .where(eq(applications.applicantUserId, applicantUserId))
    .limit(1)

  if (!application) throw notFound('Your application')
  const fullName = [application.firstName, application.lastName].filter(Boolean).join(' ')

  if (application.status !== 'Accepted') {
    throw badRequest('No admission offer is waiting for you.')
  }

  const [offer] = await db
    .select({
      id: admissionOffers.id,
      acceptedAt: admissionOffers.acceptedAt,
      declinedAt: admissionOffers.declinedAt,
      expiresAt: admissionOffers.expiresAt,
    })
    .from(admissionOffers)
    .where(eq(admissionOffers.applicationId, application.id))
    .limit(1)

  if (!offer) throw badRequest('No admission offer is waiting for you.')
  if (offer.acceptedAt) throw conflict('You have already accepted this admission offer.')
  if (offer.declinedAt) throw conflict('You have already declined this admission offer.')
  if (new Date(offer.expiresAt).getTime() <= Date.now()) {
    throw badRequest('This admission offer has expired. Contact the admissions office.')
  }

  const now = new Date().toISOString()
  await db
    .update(admissionOffers)
    .set({ declinedAt: now })
    .where(eq(admissionOffers.id, offer.id))

  void notifyAdmissionOfferDeclined({
    institutionId,
    to: application.email,
    fullName,
    reference: application.reference,
  })

  return { reference: application.reference }
}
