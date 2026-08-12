import '../../config/load-dotenv'
import { parseArgs } from 'node:util'
import { env } from '../../config/env'
import { createLogger } from '../../lib/logger'
import { closeAllConnections } from '../connection'
import { provisionInstitution } from '../provision'

/**
 * Adds an institution to the platform.
 *
 *   bun run institution:create --name "University of Kigali" --slug uok \
 *     --short-name UoK --email registrar@uok.ac.rw
 */
async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      slug: { type: 'string' },
      'short-name': { type: 'string' },
      email: { type: 'string' },
      timezone: { type: 'string' },
      locale: { type: 'string' },
    },
  })

  if (!values.name || !values.slug || !values['short-name'] || !values.email) {
    process.stderr.write(
      'Missing required options.\n\n' +
        'Usage: bun run institution:create --name <name> --slug <slug> ' +
        '--short-name <short> --email <contact email> [--timezone <tz>] [--locale en|fr|rw]\n',
    )
    process.exit(1)
  }

  const logger = createLogger(env().LOG_LEVEL, { command: 'institution:create' })

  try {
    const result = await provisionInstitution(
      {
        name: values.name,
        slug: values.slug,
        shortName: values['short-name'],
        contactEmail: values.email,
        ...(values.timezone ? { timezone: values.timezone } : {}),
        ...(values.locale ? { locale: values.locale as 'en' | 'fr' | 'rw' } : {}),
      },
      { logger },
    )

    process.stdout.write(
      `\nInstitution ready.\n  id:       ${result.institutionId}\n` +
        `  slug:     ${result.slug}\n  database: ${result.databaseName}\n\n`,
    )
    await closeAllConnections()
    process.exit(0)
  } catch (error) {
    logger.error('Could not create the institution', { error })
    await closeAllConnections()
    process.exit(1)
  }
}

void main()
