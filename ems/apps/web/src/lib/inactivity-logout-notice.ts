const INACTIVITY_LOGOUT_KEY = 'stackedu:inactivity-logout'

/** Set when an auto sign-out happens after idle time, so login can explain why. */
export function rememberInactivityLogout(): void {
  sessionStorage.setItem(INACTIVITY_LOGOUT_KEY, '1')
}

export const INACTIVITY_LOGOUT_NOTICE = {
  title: 'You were signed out',
  description:
    'You were inactive for a while, so we signed you out to keep your account safe. Sign in again to continue.',
} as const

export function hasInactivityLogoutNotice(): boolean {
  return sessionStorage.getItem(INACTIVITY_LOGOUT_KEY) === '1'
}

/** Clears the flag once the root toast has been shown. */
export function dismissInactivityLogoutNotice(): void {
  sessionStorage.removeItem(INACTIVITY_LOGOUT_KEY)
}
