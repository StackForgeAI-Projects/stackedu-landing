import '../../config/load-dotenv'
import { parseArgs } from 'node:util'
import { count, eq, inArray, or } from 'drizzle-orm'
import { deleteStoredObjectsByPrefix } from '../../lib/storage'
import { closeAllConnections, getInstitutionDb, getPlatformDb } from '../connection'
import {
  admissionOffers,
  applicationDocuments,
  applicationPayments,
  applicationReviews,
  applications,
} from '../institution/schema/admissions'
import { users, verificationTokens } from '../institution/schema/people'
import { institutions } from '../platform/schema'

/**
 * Removes all applicant-related data for one institution.
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

  const [
    [applicationCount],
    [documentCount],
    [reviewCount],
    [paymentCount],
    [offerCount],
    [applicantUserCount],
  ] = await Promise.all([
    db.select({ value: count() }).from(applications),
    db.select({ value: count() }).from(applicationDocuments),
    db.select({ value: count() }).from(applicationReviews),
    db.select({ value: count() }).from(applicationPayments),
    db.select({ value: count() }).from(admissionOffers),
    db.select({ value: count() }).from(users).where(eq(users.role, 'Applicant')),
  ])

  const applicantAccounts = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, 'Applicant'))

  const applicantIds = applicantAccounts.map((row) => row.id)
  const applicantEmails = applicantAccounts.map((row) => row.email)
  const tokenConditions = [
    ...(applicantIds.length ? [inArray(verificationTokens.identifier, applicantIds)] : []),
    ...(applicantEmails.length ? [inArray(verificationTokens.identifier, applicantEmails)] : []),
  ]

  const [verificationTokenCount] = tokenConditions.length
    ? await db
        .select({ value: count() })
        .from(verificationTokens)
        .where(or(...tokenConditions))
    : [{ value: 0 }]

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
      `  verification_tokens:   ${verificationTokenCount?.value ?? 0}\n` +
      `  storage_prefix:        ${storagePrefix}/\n\n`,
  )

  if (!values.confirm) {
    process.stdout.write('Run again with --confirm to delete this data.\n\n')
    await closeAllConnections()
    process.exit(0)
  }

  await db.transaction(async (tx) => {
    await tx.delete(applications)

    if (tokenConditions.length) {
      await tx.delete(verificationTokens).where(or(...tokenConditions))
    }

    await tx.delete(users).where(eq(users.role, 'Applicant'))
  })

  const deletedObjects = await deleteStoredObjectsByPrefix(storagePrefix)

  process.stdout.write(
    `Done.\n` +
      `  Removed ${applicationCount?.value ?? 0} application(s) and ${applicantUserCount?.value ?? 0} applicant account(s).\n` +
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
