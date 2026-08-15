const WELCOME_STORAGE_KEY = 'stackedu:welcome-name'

export function rememberWelcome(fullName: string): void {
  const first = fullName.trim().split(/\s+/)[0]
  if (!first) return
  sessionStorage.setItem(WELCOME_STORAGE_KEY, first)
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
