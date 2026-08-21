import { logout, sessionQueryKey } from '@/lib/api/auth'
import { rememberInactivityLogout } from '@/lib/inactivity-logout-notice'
import { queryClient } from '@/lib/query-client'

export async function performSignOutRedirect(destination: string): Promise<void> {
  await queryClient.cancelQueries()
  await logout().catch(() => undefined)
  queryClient.setQueryData(sessionQueryKey, null)
  queryClient.removeQueries()
  window.location.replace(destination)
}

/**
 * Ends the session after idle timeout without surfacing API errors from
 * in-flight dashboard queries. A hard navigation clears React state cleanly.
 */
export async function performInactivityLogout(destination = '/login'): Promise<void> {
  rememberInactivityLogout()
  await performSignOutRedirect(destination)
}
