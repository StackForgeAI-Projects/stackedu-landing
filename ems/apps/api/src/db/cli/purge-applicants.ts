import '../../config/load-dotenv'
import { parseArgs } from 'node:util'
import { and, count, eq, inArray, or } from 'drizzle-orm'
import { deleteStoredObjectsByPrefix } from '../../lib/storage'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from '../connection'
import {
  admissionOffers,
  applicationDocuments,
  applicationPayments,
  applicationReviews,
  applications,
} from '../institution/schema/admissions'
import { sessions, users, verificationTokens } from '../institution/schema/people'
import { students } from '../institution/schema/students'
import { institutions, userDirectory } from '../platform/schema'

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

/**
 * Removes all applicant-related data for one institution, including platform
 * login directory rows so the same email can register again.
 *
 *   bun run purge-applicants --slug sfu
 *   bun run purge-applicants --slug sfu --confirm
 */
async function main() {
  const { values } = parseArgs({
    options: {
      slug: { type: 'string' },
      confirm: { type: 'boolean', default: false },
    },
  })

  if (!values.slug) {
    process.stderr.write(
      'Usage: bun run purge-applicants --slug <institution-slug> [--confirm]\n\n' +
        'Without --confirm this only prints counts (dry run).\n',
    )
    process.exit(1)
  }

  const platform = getPlatformDb()
  const [institution] = await platform
    .select({ id: institutions.id, slug: institutions.slug, name: institutions.name })
    .from(institutions)
    .where(eq(institutions.slug, values.slug))
    .limit(1)

  if (!institution) {
    process.stderr.write(`No institution found with slug "${values.slug}".\n`)
    await closeAllConnections()
    process.exit(1)
  }

  const db = await getInstitutionDb(institution.id)

  const applicationRows = await db
    .select({
      applicantUserId: applications.applicantUserId,
      convertedStudentId: applications.convertedStudentId,
      email: applications.email,
    })
    .from(applications)

  const roleApplicantUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, 'Applicant'))

  const applicantUserIds = unique(
    [
      ...applicationRows.map((row) => row.applicantUserId),
      ...roleApplicantUsers.map((row) => row.id),
    ].filter((id): id is string => Boolean(id)),
  )

  const convertedStudentIds = unique(
    applicationRows.map((row) => row.convertedStudentId).filter((id): id is string => Boolean(id)),
  )

  const convertedStudentUsers =
    convertedStudentIds.length > 0
      ? await db
          .select({ userId: students.userId })
          .from(students)
          .where(inArray(students.id, convertedStudentIds))
      : []

  const allUserIds = unique([
    ...applicantUserIds,
    ...convertedStudentUsers.map((row) => row.userId),
  ])

  const allEmails = unique([
    ...applicationRows.map((row) => row.email.trim().toLowerCase()),
    ...roleApplicantUsers.map((row) => row.email.trim().toLowerCase()),
  ])

  const tokenConditions = [
    ...(allUserIds.length ? [inArray(verificationTokens.identifier, allUserIds)] : []),
    ...(allEmails.length ? [inArray(verificationTokens.identifier, allEmails)] : []),
  ]

  const directoryConditions = [
    eq(userDirectory.institutionId, institution.id),
    or(
      eq(userDirectory.role, 'Applicant'),
      ...(allUserIds.length ? [inArray(userDirectory.institutionUserId, allUserIds)] : []),
      ...(allEmails.length ? [inArray(userDirectory.email, allEmails)] : []),
    ),
  ]

  const [
    [applicationCount],
    [documentCount],
    [reviewCount],
    [paymentCount],
    [offerCount],
    [sessionCount],
    [applicantUserCount],
    [verificationTokenCount],
    [directoryCount],
  ] = await Promise.all([
    db.select({ value: count() }).from(applications),
    db.select({ value: count() }).from(applicationDocuments),
    db.select({ value: count() }).from(applicationReviews),
    db.select({ value: count() }).from(applicationPayments),
    db.select({ value: count() }).from(admissionOffers),
    allUserIds.length
      ? db.select({ value: count() }).from(sessions).where(inArray(sessions.userId, allUserIds))
      : Promise.resolve([{ value: 0 }]),
    db.select({ value: count() }).from(users).where(eq(users.role, 'Applicant')),
    tokenConditions.length
      ? db.select({ value: count() }).from(verificationTokens).where(or(...tokenConditions))
      : Promise.resolve([{ value: 0 }]),
    platform
      .select({ value: count() })
      .from(userDirectory)
      .where(and(...directoryConditions)),
  ])

  const storagePrefix = `institutions/${institution.id}/applications`

  process.stdout.write(
    `\nInstitution: ${institution.name} (${institution.slug})\n` +
      `${values.confirm ? 'PURGING applicant data…\n' : 'Dry run — nothing will be deleted.\n'}\n` +
      `  applications:          ${applicationCount?.value ?? 0}\n` +
      `  application_documents: ${documentCount?.value ?? 0}\n` +
      `  application_reviews:   ${reviewCount?.value ?? 0}\n` +
      `  application_payments:  ${paymentCount?.value ?? 0}\n` +
      `  admission_offers:      ${offerCount?.value ?? 0}\n` +
      `  applicant_users:       ${applicantUserCount?.value ?? 0}\n` +
      `  applicant_sessions:    ${sessionCount?.value ?? 0}\n` +
      `  verification_tokens:   ${verificationTokenCount?.value ?? 0}\n` +
      `  user_directory_rows:   ${directoryCount?.value ?? 0}\n` +
      `  storage_prefix:        ${storagePrefix}/\n\n`,
  )

  if (!values.confirm) {
    process.stdout.write('Run again with --confirm to delete this data.\n\n')
    await closeAllConnections()
    process.exit(0)
  }

  await db.transaction(async (tx) => {
    await tx.delete(applications)

    if (convertedStudentIds.length) {
      await tx.delete(students).where(inArray(students.id, convertedStudentIds))
    }

    if (allUserIds.length) {
      await tx.delete(sessions).where(inArray(sessions.userId, allUserIds))
    }

    if (tokenConditions.length) {
      await tx.delete(verificationTokens).where(or(...tokenConditions))
    }

    if (allUserIds.length) {
      await tx.delete(users).where(inArray(users.id, allUserIds))
    } else {
      await tx.delete(users).where(eq(users.role, 'Applicant'))
    }
  })

  await platform.delete(userDirectory).where(and(...directoryConditions))

  const deletedObjects = await deleteStoredObjectsByPrefix(storagePrefix)

  process.stdout.write(
    `Done.\n` +
      `  Removed ${applicationCount?.value ?? 0} application(s) and related records.\n` +
      `  Removed ${directoryCount?.value ?? 0} login directory row(s) — emails can register again.\n` +
      `  Cleared ${deletedObjects} stored file object(s) under ${storagePrefix}/.\n\n`,
  )

  await closeAllConnections()
  process.exit(0)
}

void main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  await closeAllConnections()
  process.exit(1)
})
