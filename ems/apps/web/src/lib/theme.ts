export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'stackedu-theme'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'dark' ? 'dark' : 'light'
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function initTheme(): ThemeMode {
  const mode = getStoredTheme()
  applyTheme(mode)
  return mode
}
