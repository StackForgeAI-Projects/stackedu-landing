import type { CookieOptions } from 'hono/utils/cookie'
import type { Env } from '../config/env'

export const SESSION_COOKIE = 'stackedu_session'

/**
 * Cookie settings for the session.
 *
 * The web app and the API sit on different hosts of the same site in
 * production (app.stackedu.rw and api.stackedu.rw), so setting the domain to
 * the shared parent makes one cookie work for both. That also keeps SameSite
 * at Lax rather than None, which would expose us to cross-site requests.
 */
export function sessionCookieOptions(env: Env, expiresAt?: Date): CookieOptions {
  const secure = env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    ...(expiresAt ? { expires: expiresAt } : {}),
  }
}
