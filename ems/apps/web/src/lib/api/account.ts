import type {
  AccountProfile,
  ChangePasswordRequest,
  NotificationPreferenceItem,
  SessionUser,
  UpdateAccountProfileRequest,
  UpdateAccountSecurityRequest,
  UpdateNotificationPreferencesRequest,
} from '@stackedu/shared'
import { api } from './client'

export const accountProfileQueryKey = ['account', 'profile'] as const
export const accountNotificationPrefsQueryKey = ['account', 'notification-preferences'] as const

export async function getAccountProfile(): Promise<AccountProfile> {
  const { profile } = await api.get<{ profile: AccountProfile }>('/account/profile')
  return profile
}

export async function updateAccountProfile(input: UpdateAccountProfileRequest) {
  return api.patch<{ profile: AccountProfile; user: SessionUser }>('/account/profile', input)
}

export async function changeAccountPassword(input: ChangePasswordRequest) {
  return api.post<{ ok: boolean }>('/account/password', input)
}

export async function updateAccountSecurity(input: UpdateAccountSecurityRequest) {
  const { profile } = await api.patch<{ profile: AccountProfile }>('/account/security', input)
  return profile
}

export async function getAccountNotificationPreferences(): Promise<NotificationPreferenceItem[]> {
  const { preferences } = await api.get<{ preferences: NotificationPreferenceItem[] }>(
    '/account/notification-preferences',
  )
  return preferences
}

export async function updateAccountNotificationPreferences(input: UpdateNotificationPreferencesRequest) {
  const { preferences } = await api.patch<{ preferences: NotificationPreferenceItem[] }>(
    '/account/notification-preferences',
    input,
  )
  return preferences
}
