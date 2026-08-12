import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import type { Health } from '@stackedu/shared'
import { env } from '../config/env'
import { getPlatformDb, openInstitutionPoolCount } from '../db/connection'
import type { RequestVariables } from '../middleware/request-context'

const startedAt = Date.now()

export const healthRoutes = new Hono<{ Variables: RequestVariables }>()

/**
 * Liveness. Answers as long as the process is running.
 *
 * Render uses this to decide whether to restart the container, so it must not
 * touch the database: a brief database problem should not cause the API to be
 * killed and replaced, which would make the outage longer.
 */
healthRoutes.get('/health', (c) =>
  c.json({ status: 'ok' as const, service: 'stackedu-api' as const }),
)

/**
 * Readiness. Reports whether the API can actually serve traffic, including its
 * dependencies. This is the one to watch in monitoring.
 */
healthRoutes.get('/health/ready', async (c) => {
  const checks: Health['checks'] = {}

  const dbStartedAt = performance.now()
  try {
    await getPlatformDb().execute(sql`select 1`)
    checks.platformDatabase = { ok: true, latencyMs: Math.round(performance.now() - dbStartedAt) }
  } catch (error) {
    c.get('logger').error('Readiness check failed', { error })
    checks.platformDatabase = { ok: false, latencyMs: Math.round(performance.now() - dbStartedAt) }
  }

  const healthy = Object.values(checks).every((check) => check.ok)

  const body: Health = {
    status: healthy ? 'ok' : 'degraded',
    service: 'stackedu-api',
    version: env().APP_VERSION,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    checks,
  }

  return c.json(body, healthy ? 200 : 503)
})

/** Operational detail, useful when diagnosing connection pool behaviour. */
healthRoutes.get('/health/pools', (c) =>
  c.json({ openInstitutionPools: openInstitutionPoolCount() }),
)
