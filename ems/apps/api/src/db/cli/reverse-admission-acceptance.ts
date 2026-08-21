import '../../config/load-dotenv'
import { eq, or } from 'drizzle-orm'
import { env } from '../../config/env'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from '../connection'
import { admissionOffers, applications } from '../institution/schema/admissions'
import { users } from '../institution/schema/people'
import { studentProfiles, students } from '../institution/schema/students'
import { institutions, userDirectory } from '../platform/schema'

/**
 * Local dev only — reverses an applicant who accepted admission back to Applicant.
 *
 *   bun run reverse-admission -- applicant.demo@sfu.ac.rw
 */
async function main() {
  if (env().NODE_ENV === 'production') {
    process.stderr.write('Refusing to run in production.\n')
    process.exit(1)
  }

  const identifier = process.argv[2]?.trim()
  if (!identifier) {
    process.stderr.write('Usage: bun run reverse-admission -- <email-or-application-id>\n')
    process.exit(1)
  }

  const platform = getPlatformDb()
  const normalised = identifier.toUpperCase()

  const [directory] = await platform
    .select({
      institutionId: userDirectory.institutionId,
      institutionUserId: userDirectory.institutionUserId,
      email: userDirectory.email,
    })
    .from(userDirectory)
    .where(
      or(
        eq(userDirectory.email, identifier.toLowerCase()),
        eq(userDirectory.alternateIdentifier, normalised),
      ),
    )
    .limit(1)

  if (!directory) {
    process.stderr.write(`No account found for "${identifier}".\n`)
    await closeAllConnections()
    process.exit(1)
  }

  const db = await getInstitutionDb(directory.institutionId)

  const [application] = await db
    .select({
      id: applications.id,
      reference: applications.reference,
      convertedStudentId: applications.convertedStudentId,
    })
    .from(applications)
    .where(eq(applications.applicantUserId, directory.institutionUserId))
    .limit(1)

  if (!application) {
    process.stderr.write('No application found for that account.\n')
    await closeAllConnections()
    process.exit(1)
  }

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, directory.institutionUserId))
    .limit(1)

  if (student) {
    await db.delete(studentProfiles).where(eq(studentProfiles.studentId, student.id))
    await db.delete(students).where(eq(students.id, student.id))
  }

  await db
    .update(applications)
    .set({ convertedStudentId: null })
    .where(eq(applications.id, application.id))

  await db
    .update(admissionOffers)
    .set({ acceptedAt: null, declinedAt: null })
    .where(eq(admissionOffers.applicationId, application.id))

  await db
    .update(users)
    .set({ role: 'Applicant' })
    .where(eq(users.id, directory.institutionUserId))

  await platform
    .update(userDirectory)
    .set({ role: 'Applicant', alternateIdentifier: application.reference })
    .where(eq(userDirectory.institutionUserId, directory.institutionUserId))

  const [institution] = await platform
    .select({ slug: institutions.slug })
    .from(institutions)
    .where(eq(institutions.id, directory.institutionId))
    .limit(1)

  process.stdout.write(
    `\nReversed admission acceptance for ${directory.email} (${application.reference}).\n` +
      `Role restored to Applicant on ${institution?.slug ?? 'institution'}.\n` +
      `Sign in at /apply/track to accept or decline the offer again.\n\n`,
  )

  await closeAllConnections()
  process.exit(0)
}

void main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  await closeAllConnections()
  process.exit(1)
})
