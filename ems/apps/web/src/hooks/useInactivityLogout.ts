import { useCallback, useEffect, useRef, useState } from 'react'

const IDLE_MS = 3 * 60 * 1000
const LOGOUT_COUNTDOWN_SEC = 60

export function useInactivityLogout(onLogout: () => void) {
  const [open, setOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(LOGOUT_COUNTDOWN_SEC)
  const idleTimer = useRef<number | null>(null)
  const countdownTimer = useRef<number | null>(null)

  const clearIdleTimer = () => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
  }

  const clearCountdownTimer = () => {
    if (countdownTimer.current !== null) {
      window.clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
  }

  const resetIdleTimer = useCallback(() => {
    if (open) return
    clearIdleTimer()
    idleTimer.current = window.setTimeout(() => {
      setSecondsLeft(LOGOUT_COUNTDOWN_SEC)
      setOpen(true)
    }, IDLE_MS)
  }, [open])

  const staySignedIn = useCallback(() => {
    clearCountdownTimer()
    setOpen(false)
    setSecondsLeft(LOGOUT_COUNTDOWN_SEC)
    resetIdleTimer()
  }, [resetIdleTimer])

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    const onActivity = () => resetIdleTimer()
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }))
    resetIdleTimer()
    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity))
      clearIdleTimer()
      clearCountdownTimer()
    }
  }, [resetIdleTimer])

  useEffect(() => {
    if (!open) return
    clearIdleTimer()
    clearCountdownTimer()
    countdownTimer.current = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearCountdownTimer()
          onLogout()
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => clearCountdownTimer()
  }, [open, onLogout])

  return { open, secondsLeft, staySignedIn, onLogoutNow: onLogout }
}
