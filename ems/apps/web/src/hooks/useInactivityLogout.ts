import { useCallback, useEffect, useRef, useState } from 'react'
import {
  computeInactivityIdleState,
  INACTIVITY_LOGOUT_COUNTDOWN_SEC,
} from '@stackedu/shared'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'touchmove',
  'touchend',
  'scroll',
  'pointerdown',
  'click',
]

export function useInactivityLogout(onLogout: () => void) {
  const [open, setOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(INACTIVITY_LOGOUT_COUNTDOWN_SEC)
  const lastActivityAt = useRef(Date.now())
  const warningOpen = useRef(false)
  const onLogoutRef = useRef(onLogout)
  onLogoutRef.current = onLogout

  const markActivity = useCallback(() => {
    if (warningOpen.current) return
    lastActivityAt.current = Date.now()
  }, [])

  const evaluateIdleState = useCallback(() => {
    const state = computeInactivityIdleState(lastActivityAt.current, Date.now())

    if (state.phase === 'logout') {
      onLogoutRef.current()
      return
    }

    if (state.phase === 'warning') {
      warningOpen.current = true
      setOpen(true)
      setSecondsLeft(state.secondsLeft)
      return
    }

    if (warningOpen.current) {
      warningOpen.current = false
      setOpen(false)
      setSecondsLeft(INACTIVITY_LOGOUT_COUNTDOWN_SEC)
    }
  }, [])

  const staySignedIn = useCallback(() => {
    warningOpen.current = false
    setOpen(false)
    setSecondsLeft(INACTIVITY_LOGOUT_COUNTDOWN_SEC)
    lastActivityAt.current = Date.now()
  }, [])

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, markActivity, { passive: true })
    })

    const onReturn = () => evaluateIdleState()
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('pageshow', onReturn)
    window.addEventListener('focus', onReturn)

    const tick = window.setInterval(evaluateIdleState, 1000)
    evaluateIdleState()

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, markActivity)
      })
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('pageshow', onReturn)
      window.removeEventListener('focus', onReturn)
      window.clearInterval(tick)
    }
  }, [evaluateIdleState, markActivity])

  return { open, secondsLeft, staySignedIn, onLogoutNow: onLogout }
}
