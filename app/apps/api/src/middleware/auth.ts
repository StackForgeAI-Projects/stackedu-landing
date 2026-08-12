import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import type { SessionUser, UserRole } from '@stackedu/shared'
import { forbidden, unauthenticated } from '../lib/errors'
import { resolveSession } from '../services/auth'
import { SESSION_COOKIE } from '../lib/cookies'

export interface AuthVariables {
  user: SessionUser
}

/**
 * Rejects the request unless it carries a valid session.
 *
 * Everything downstream can then read c.get('user') without null checks, and
 * no route can accidentally forget to authenticate: forgetting the middleware
 * means there is no user to read.
 */
export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const cookie = getCookie(c, SESSION_COOKIE)
  if (!cookie) throw unauthenticated()

  const user = await resolveSession(cookie)
  if (!user) throw unauthenticated('Your session has expired. Please sign in again.')

  c.set('user', user)
  await next()
}

/**
 * Restricts a route to particular roles. Must run after requireAuth.
 *
 * The role comes from the session, never from the request, so a user cannot
 * reach another portal by editing what the browser sends.
 */
export function requireRole(
  ...allowed: UserRole[]
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const user = c.get('user')
    if (!user) throw unauthenticated()
    if (!allowed.includes(user.role)) throw forbidden()
    await next()
  }
}
