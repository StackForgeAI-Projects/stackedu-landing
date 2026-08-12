import '../../config/load-dotenv'
import { env } from '../../config/env'
import { createLogger } from '../../lib/logger'
import { closeAllConnections } from '../connection'
import { migrateAllInstitutions, migratePlatform } from '../migrate'

/**
 * Applies pending migrations to the platform database and then to every
 * institution database, in order.
 *
 * Run as a deliberate deployment step rather than on application start-up, so
 * a rollout can be paused if something looks wrong.
 */
async function main() {
  const logger = createLogger(env().LOG_LEVEL, { command: 'db:migrate' })

  const platform = await migratePlatform(logger)
  if (!platform.succeeded) {
    logger.error('Stopping: the platform database could not be migrated')
    await closeAllConnections()
    process.exit(1)
  }

  const outcomes = await migrateAllInstitutions({ logger })
  const failed = outcomes.filter((outcome) => !outcome.succeeded)

  logger.info('Migration run finished', {
    institutions: outcomes.length,
    succeeded: outcomes.length - failed.length,
    failed: failed.length,
  })

  for (const outcome of outcomes) {
    const mark = outcome.succeeded ? 'ok  ' : 'FAIL'
    process.stdout.write(
      `  ${mark} ${outcome.target.padEnd(24)} ${outcome.durationMs}ms${
        outcome.error ? ` — ${outcome.error}` : ''
      }\n`,
    )
  }

  await closeAllConnections()
  process.exit(failed.length > 0 ? 1 : 0)
}

void main()
