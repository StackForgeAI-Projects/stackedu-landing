type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

/**
 * Keys whose values must never reach the logs. Matching is case-insensitive and
 * by substring, so `userPassword` and `AUTH_TOKEN` are both caught.
 */
const REDACTED_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'connectionurl',
  'databaseurl',
  'apikey',
  'credential',
  'twofactorsecret',
]

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((entry) => redact(entry, depth + 1))

  const output: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const shouldRedact = REDACTED_KEYS.some((needle) => key.toLowerCase().includes(needle))
    output[key] = shouldRedact ? '[redacted]' : redact(entry, depth + 1)
  }
  return output
}

function serialiseError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { error: String(error) }
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.cause ? { cause: serialiseError(error.cause) } : {}),
  }
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown> & { error?: unknown }): void
  child(bindings: Record<string, unknown>): Logger
}

/**
 * Logs single-line JSON, which is what Better Stack and Axiom expect to ingest
 * and what makes a field searchable rather than buried in a text blob.
 */
export function createLogger(
  minLevel: Level = 'info',
  bindings: Record<string, unknown> = {},
): Logger {
  const write = (level: Level, message: string, context?: Record<string, unknown>) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return

    const { error, ...rest } = context ?? {}
    const entry = {
      level,
      time: new Date().toISOString(),
      message,
      ...bindings,
      ...(redact(rest) as Record<string, unknown>),
      ...(error === undefined ? {} : { error: serialiseError(error) }),
    }

    const line = JSON.stringify(entry)
    if (level === 'error' || level === 'warn') process.stderr.write(`${line}\n`)
    else process.stdout.write(`${line}\n`)
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
    child: (extra) => createLogger(minLevel, { ...bindings, ...extra }),
  }
}
