import { useEffect } from 'react'
import {
  consumeInactivityLogoutNotice,
  shouldShowInactivityLogoutNotice,
  showInactivityLogoutNotice,
} from '@/lib/inactivity-logout-notice'

const TOAST_DELAY_MS = 200

/** Shows a top-right alert after an idle auto sign-out — mounted once at the app root. */
export function InactivityLogoutNotice() {
  useEffect(() => {
    if (!shouldShowInactivityLogoutNotice()) return

    const timer = window.setTimeout(() => {
      showInactivityLogoutNotice()
      consumeInactivityLogoutNotice()
    }, TOAST_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [])

  return null
}
