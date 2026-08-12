import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Loads the monorepo's root .env for local development.
 *
 * Import this before anything that reads configuration. In production there is
 * no .env file — Render supplies real environment variables — so this quietly
 * does nothing.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const rootEnvFile = path.resolve(here, '../../../../.env')

if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile)
}
