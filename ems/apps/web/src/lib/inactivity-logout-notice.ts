import { notifyInfo } from '@/lib/notify'

const INACTIVITY_LOGOUT_KEY = 'stackedu:inactivity-logout'
const INACTIVITY_LOGOUT_TOAST_ID = 'inactivity-logout-notice'

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

export function dismissInactivityLogoutNotice(): void {
  sessionStorage.removeItem(INACTIVITY_LOGOUT_KEY)
}

/** Append a query flag so the notice survives hard navigation and cached bundles. */
export function inactivityLogoutDestination(path = '/login'): string {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('signedOut', 'inactivity')
  return `${url.pathname}${url.search}${url.hash}`
}

function stripInactivityQueryParam(): void {
  const params = new URLSearchParams(window.location.search)
  if (params.get('signedOut') !== 'inactivity') return

  params.delete('signedOut')
  const query = params.toString()
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState(window.history.state, '', next)
}

/** Check without clearing — safe for React StrictMode effect setup. */
export function shouldShowInactivityLogoutNotice(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('signedOut') === 'inactivity' || hasInactivityLogoutNotice()
}

/** Clear the flag and URL marker after the toast is shown. */
export function consumeInactivityLogoutNotice(): void {
  stripInactivityQueryParam()
  dismissInactivityLogoutNotice()
}

/** Top-right alert — call only after Sonner has mounted. */
export function showInactivityLogoutNotice(): void {
  notifyInfo(INACTIVITY_LOGOUT_NOTICE.title, INACTIVITY_LOGOUT_NOTICE.description, {
    duration: 8000,
    id: INACTIVITY_LOGOUT_TOAST_ID,
  })
}
