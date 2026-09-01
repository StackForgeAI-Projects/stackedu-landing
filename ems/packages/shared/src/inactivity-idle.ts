/** Idle time before the session warning appears. */
export const INACTIVITY_IDLE_MS = 3 * 60 * 1000

/** Countdown shown before an automatic sign-out. */
export const INACTIVITY_LOGOUT_COUNTDOWN_SEC = 60

export type InactivityIdlePhase = 'active' | 'warning' | 'logout'

/** Wall-clock idle check — reliable on mobile when timers are throttled in the background. */
export function computeInactivityIdleState(
  lastActivityAtMs: number,
  nowMs: number,
): { phase: InactivityIdlePhase; secondsLeft: number } {
  const elapsed = nowMs - lastActivityAtMs
  const warningMs = INACTIVITY_IDLE_MS
  const logoutMs = warningMs + INACTIVITY_LOGOUT_COUNTDOWN_SEC * 1000

  if (elapsed >= logoutMs) {
    return { phase: 'logout', secondsLeft: 0 }
  }
  if (elapsed >= warningMs) {
    const sinceWarning = elapsed - warningMs
    const secondsLeft = Math.max(
      1,
      INACTIVITY_LOGOUT_COUNTDOWN_SEC - Math.floor(sinceWarning / 1000),
    )
    return { phase: 'warning', secondsLeft }
  }
  return { phase: 'active', secondsLeft: INACTIVITY_LOGOUT_COUNTDOWN_SEC }
}
