import type { LoginRequest, SessionResponse, SessionUser } from '@stackedu/shared'
import { api, ApiClientError } from './client'

export const sessionQueryKey = ['auth', 'session'] as const

export async function login(input: LoginRequest): Promise<SessionUser> {
  const { user } = await api.post<SessionResponse>('/auth/login', input)
  return user
}

export async function logout(): Promise<void> {
  await api.post<void>('/auth/logout')
}

/**
 * Returns the signed-in user, or null when nobody is signed in.
 *
 * A 401 here is the ordinary answer for a signed-out visitor rather than a
 * failure, so it resolves to null instead of throwing and leaving every caller
 * to special-case it.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const { user } = await api.get<SessionResponse>('/auth/session')
    return user
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null
    throw error
  }
}
