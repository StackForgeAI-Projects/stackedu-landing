import { describe, expect, it } from 'vitest'
import {
  computeInactivityIdleState,
  INACTIVITY_IDLE_MS,
  INACTIVITY_LOGOUT_COUNTDOWN_SEC,
} from '@stackedu/shared'

describe('inactivity idle timing', () => {
  const startedAt = 1_700_000_000_000

  it('stays active before the idle threshold', () => {
    const state = computeInactivityIdleState(startedAt, startedAt + INACTIVITY_IDLE_MS - 1)
    expect(state.phase).toBe('active')
  })

  it('enters the warning phase after idle time', () => {
    const state = computeInactivityIdleState(startedAt, startedAt + INACTIVITY_IDLE_MS + 5_000)
    expect(state.phase).toBe('warning')
    expect(state.secondsLeft).toBe(INACTIVITY_LOGOUT_COUNTDOWN_SEC - 5)
  })

  it('requests logout after the warning countdown elapses', () => {
    const state = computeInactivityIdleState(
      startedAt,
      startedAt + INACTIVITY_IDLE_MS + INACTIVITY_LOGOUT_COUNTDOWN_SEC * 1000,
    )
    expect(state.phase).toBe('logout')
  })

  it('still logs out when the device returns from a suspended background tab', () => {
    const state = computeInactivityIdleState(
      startedAt,
      startedAt + INACTIVITY_IDLE_MS + INACTIVITY_LOGOUT_COUNTDOWN_SEC * 1000 + 60_000,
    )
    expect(state.phase).toBe('logout')
  })
})
