import { randomUUID } from 'node:crypto'
import type { MiddlewareHandler } from 'hono'
import type { Logger } from '../lib/logger'

export interface RequestVariables {
  requestId: string
  logger: Logger
}

/**
 * Gives every request an id and a logger bound to it.
 *
 * The id is returned in the `x-request-id` header and included in any error
 * shown to a user, so a support message saying "it failed, the code was
 * 3f2a…" is enough to find the exact request in the logs.
 */
export function requestContext(baseLogger: Logger): MiddlewareHandler<{
  Variables: RequestVariables
}> {
  return async (c, next) => {
    const incoming = c.req.header('x-request-id')
    const requestId = incoming && incoming.length <= 64 ? incoming : randomUUID()

    c.set('requestId', requestId)
    c.set('logger', baseLogger.child({ requestId }))
    c.header('x-request-id', requestId)

    const startedAt = performance.now()
    await next()

    const durationMs = Math.round(performance.now() - startedAt)
    const entry = {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
    }

    if (c.res.status >= 500) c.get('logger').error('Request failed', entry)
    else c.get('logger').info('Request completed', entry)
  }
}
