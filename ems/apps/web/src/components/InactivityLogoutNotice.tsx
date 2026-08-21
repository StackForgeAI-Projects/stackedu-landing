import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  consumeInactivityLogoutNotice,
  INACTIVITY_LOGOUT_TOAST_ID,
  shouldShowInactivityLogoutNotice,
  showInactivityLogoutNotice,
} from '@/lib/inactivity-logout-notice'

const TOAST_DELAY_MS = 200

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
]

/** Shows a persistent top-right alert after an idle auto sign-out. */
export function InactivityLogoutNotice() {
  useEffect(() => {
    if (!shouldShowInactivityLogoutNotice()) return

    let finished = false
    const removeActivityListeners: Array<() => void> = []

    const finish = () => {
      if (finished) return
      finished = true
      toast.dismiss(INACTIVITY_LOGOUT_TOAST_ID)
      consumeInactivityLogoutNotice()
      removeActivityListeners.forEach((remove) => remove())
    }

    const timer = window.setTimeout(() => {
      showInactivityLogoutNotice(finish)

      const onActivity = () => finish()
      ACTIVITY_EVENTS.forEach((event) => {
        window.addEventListener(event, onActivity, { passive: true })
        removeActivityListeners.push(() => window.removeEventListener(event, onActivity))
      })
    }, TOAST_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
      removeActivityListeners.forEach((remove) => remove())
    }
  }, [])

  return null
}
