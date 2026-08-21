import { notifyInfo } from '@/lib/notify'

const INACTIVITY_LOGOUT_KEY = 'stackedu:inactivity-logout'
export const INACTIVITY_LOGOUT_TOAST_ID = 'inactivity-logout-notice'

const INACTIVITY_TOAST_CLASS_NAMES = {
  toast: 'rounded-xl border shadow-sm',
  title: 'text-sm font-semibold',
  description: 'text-sm leading-relaxed',
}

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

/** Clear the flag and URL marker after the user dismisses the alert. */
export function consumeInactivityLogoutNotice(): void {
  stripInactivityQueryParam()
  dismissInactivityLogoutNotice()
}

/** Persistent top-right alert — stays until the user interacts or closes it. */
export function showInactivityLogoutNotice(onDismiss?: () => void): void {
  notifyInfo(INACTIVITY_LOGOUT_NOTICE.title, INACTIVITY_LOGOUT_NOTICE.description, {
    duration: Infinity,
    id: INACTIVITY_LOGOUT_TOAST_ID,
    onDismiss,
    classNames: {
      ...INACTIVITY_TOAST_CLASS_NAMES,
      title: `${INACTIVITY_TOAST_CLASS_NAMES.title} !text-[var(--info,#2563eb)]`,
    },
    style: {
      backgroundColor: 'var(--info-bg, #eff6ff)',
      border: '1px solid var(--info, #2563eb)',
    },
  })
}
