const INACTIVITY_LOGOUT_KEY = 'stackedu:inactivity-logout'

/** Set when an auto sign-out happens after idle time, so login can explain why. */
export function rememberInactivityLogout(): void {
  sessionStorage.setItem(INACTIVITY_LOGOUT_KEY, '1')
}

export function consumeInactivityLogoutNotice(): boolean {
  if (!sessionStorage.getItem(INACTIVITY_LOGOUT_KEY)) return false
  sessionStorage.removeItem(INACTIVITY_LOGOUT_KEY)
  return true
}

export const INACTIVITY_LOGOUT_NOTICE = {
  title: 'You were signed out',
  description:
    'You were inactive for a while, so we signed you out to keep your account safe. Sign in again to continue.',
} as const
