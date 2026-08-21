import { shouldShowInactivityLogoutNotice } from '@/lib/inactivity-logout-notice'

const BUILD_STORAGE_KEY = 'stackedu:client-build'

/** Reload once after a deploy so users never keep stale JS chunks in cache. */
export function ensureFreshClientBuild(): void {
  if (typeof window === 'undefined') return

  const buildId = import.meta.env.VITE_APP_BUILD_ID || 'dev'
  const previous = localStorage.getItem(BUILD_STORAGE_KEY)

  if (previous && previous !== buildId) {
    localStorage.setItem(BUILD_STORAGE_KEY, buildId)

    // Do not reload away from the post-logout screen before the user sees the alert.
    if (shouldShowInactivityLogoutNotice()) return

    void (async () => {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
      window.location.reload()
    })()
    return
  }

  localStorage.setItem(BUILD_STORAGE_KEY, buildId)
}
