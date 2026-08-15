import { Hono } from 'hono'
import {
  changePasswordRequestSchema,
  updateAccountProfileRequestSchema,
  updateAccountSecurityRequestSchema,
  updateNotificationPreferencesRequestSchema,
} from '@stackedu/shared'
import { validationFailed } from '../lib/errors'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import type { RequestVariables } from '../middleware/request-context'
import {
  changeAccountPassword,
  getAccountNotificationPreferences,
  getAccountProfile,
  sessionUserFrom,
  updateAccountNotificationPreferences,
  updateAccountProfile,
  updateAccountSecurity,
} from '../services/account'

type Variables = RequestVariables & Partial<AuthVariables>

export const accountRoutes = new Hono<{ Variables: Variables }>()

function fieldErrors(error: { flatten: () => { fieldErrors: unknown } }): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>
}

accountRoutes.get('/account/profile', requireAuth, async (c) => {
  const user = c.get('user')!
  return c.json({ profile: await getAccountProfile(user.institution.id, user.id) })
})

accountRoutes.patch('/account/profile', requireAuth, async (c) => {
  const parsed = updateAccountProfileRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  const profile = await updateAccountProfile(user.institution.id, user, parsed.data)
  return c.json({ profile, user: sessionUserFrom(profile, user.institution) })
})

accountRoutes.post('/account/password', requireAuth, async (c) => {
  const parsed = changePasswordRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  await changeAccountPassword(user.institution.id, user.id, parsed.data)
  return c.json({ ok: true })
})

accountRoutes.patch('/account/security', requireAuth, async (c) => {
  const parsed = updateAccountSecurityRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  return c.json({ profile: await updateAccountSecurity(user.institution.id, user.id, parsed.data) })
})

accountRoutes.get('/account/notification-preferences', requireAuth, async (c) => {
  const user = c.get('user')!
  const stored = await getAccountNotificationPreferences(user.institution.id, user.id)
  return c.json({
    preferences: Object.entries(stored).map(([key, value]) => ({ key, ...value })),
  })
})

accountRoutes.patch('/account/notification-preferences', requireAuth, async (c) => {
  const parsed = updateNotificationPreferencesRequestSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) throw validationFailed(fieldErrors(parsed.error))
  const user = c.get('user')!
  const stored = await updateAccountNotificationPreferences(user.institution.id, user.id, parsed.data)
  return c.json({
    preferences: Object.entries(stored).map(([key, value]) => ({ key, ...value })),
  })
})
