import { titleAndFirstName } from '@stackedu/shared'

const WELCOME_STORAGE_KEY = 'stackedu:welcome-name'

export function rememberWelcome(fullName: string): void {
  const name = titleAndFirstName(fullName)
  if (!name) return
  sessionStorage.setItem(WELCOME_STORAGE_KEY, name)
}

export function consumeWelcomeName(): string | null {
  const name = sessionStorage.getItem(WELCOME_STORAGE_KEY)
  if (!name) return null
  sessionStorage.removeItem(WELCOME_STORAGE_KEY)
  return name
}

export function isDashboardPath(pathname: string): boolean {
  return /\/dashboard(?:\/|$)/.test(pathname)
}
