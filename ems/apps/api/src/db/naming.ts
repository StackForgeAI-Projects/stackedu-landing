import { badRequest } from '../lib/errors'

const DATABASE_PREFIX = 'stackedu_inst_'

/**
 * PostgreSQL identifiers cannot be passed as query parameters, so a database
 * name is interpolated into `CREATE DATABASE` as text. Every name is therefore
 * built here from a strictly validated slug and checked again before use.
 */
export function institutionDatabaseName(slug: string): string {
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length > 40) {
    throw badRequest(
      'Institution slug must be lowercase letters, numbers and hyphens, and start with a letter.',
    )
  }
  return `${DATABASE_PREFIX}${slug.replaceAll('-', '_')}`
}

/** Last line of defence before a name reaches an un-parameterised statement. */
export function assertSafeDatabaseName(name: string): string {
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(name)) {
    throw badRequest(`Refusing to use unsafe database name: ${name}`)
  }
  return name
}

/** Swaps the database portion of a connection string, keeping credentials and options. */
export function withDatabaseName(connectionUrl: string, databaseName: string): string {
  const url = new URL(connectionUrl)
  url.pathname = `/${assertSafeDatabaseName(databaseName)}`
  return url.toString()
}

/** The server-level connection used to create and drop databases. */
export function adminConnectionUrl(connectionUrl: string): string {
  const url = new URL(connectionUrl)
  url.pathname = '/postgres'
  return url.toString()
}
