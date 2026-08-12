import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { loginRequestSchema, type SessionResponse } from '@stackedu/shared'
import { env } from '../config/env'
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/cookies'
import { validationFailed } from '../lib/errors'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import { login, logout } from '../services/auth'

type Variables = RequestVariables & Partial<AuthVariables>

export const authRoutes = new Hono<{ Variables: Variables }>()

/** The address the request came from, as seen through Render's proxy. */
function clientIp(forwardedFor: string | undefined): string | undefined {
  return forwardedFor?.split(',')[0]?.trim() || undefined
}

/**
 * Sign in.
 *
 * The browser sends only an email and a password. Which institution the user
 * belongs to and which role they hold are both looked up here, because they
 * decide what the user may see and so cannot be taken on trust from the client.
 */
authRoutes.post('/auth/login', async (c) => {
  const parsed = loginRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    throw validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  const result = await login({
    identifier: parsed.data.identifier,
    password: parsed.data.password,
    rememberMe: parsed.data.rememberMe,
    ipAddress: clientIp(c.req.header('x-forwarded-for')),
    userAgent: c.req.header('user-agent'),
  })

  setCookie(c, SESSION_COOKIE, result.cookieValue, sessionCookieOptions(env(), result.expiresAt))

  c.get('logger').info('Sign-in succeeded', {
    userId: result.user.id,
    role: result.user.role,
    institution: result.user.institution.slug,
  })

  return c.json<SessionResponse>({ user: result.user })
})

/** Who am I? Used by the web app on load to decide what to render. */
authRoutes.get('/auth/session', requireAuth, (c) =>
  c.json<SessionResponse>({ user: c.get('user')! }),
)

/** Sign out. Always succeeds, so a stale cookie cannot strand a user. */
authRoutes.post('/auth/logout', async (c) => {
  const cookie = getCookie(c, SESSION_COOKIE)
  if (cookie) await logout(cookie)

  deleteCookie(c, SESSION_COOKIE, sessionCookieOptions(env()))

  return c.body(null, 204)
})
