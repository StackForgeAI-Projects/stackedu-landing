import { useEffect } from 'react'
import {
  dismissInactivityLogoutNotice,
  hasInactivityLogoutNotice,
  INACTIVITY_LOGOUT_NOTICE,
} from '@/lib/inactivity-logout-notice'
import { notifyInfo } from '@/lib/notify'

/** Shows a top-right alert after an idle auto sign-out — mounted once at the app root. */
export function InactivityLogoutNotice() {
  useEffect(() => {
    if (!hasInactivityLogoutNotice()) return

    dismissInactivityLogoutNotice()
    notifyInfo(INACTIVITY_LOGOUT_NOTICE.title, INACTIVITY_LOGOUT_NOTICE.description, {
      duration: 8000,
    })
  }, [])

  return null
}
