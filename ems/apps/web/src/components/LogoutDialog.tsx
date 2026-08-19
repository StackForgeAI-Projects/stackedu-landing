import { useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'
import { logout, sessionQueryKey } from '@/lib/api/auth'
import { APPLICANT_SIGN_IN_PATH } from '@/lib/auth/portals'
import { queryClient } from '@/lib/query-client'

/**
 * Confirms before ending a session.
 *
 * Signing out by mistake is easy to do and annoying to recover from, more so
 * on a phone where the menu sits under a thumb. Both the staff shell and the
 * applicant top bar use this, so the wording and behaviour cannot drift apart.
 */
export function LogoutDialog({
  open,
  onOpenChange,
  /** Where to send them after the session ends. Staff go to /login; applicants back to track. */
  redirectTo = '/login',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isLeaving, setIsLeaving] = useState(false)

  const confirm = async () => {
    setIsLeaving(true)
    try {
      const destination = pathname.startsWith('/apply')
        ? APPLICANT_SIGN_IN_PATH
        : redirectTo

      await logout().catch(() => undefined)
      queryClient.clear()
      queryClient.setQueryData(sessionQueryKey, null)
      onOpenChange(false)

      // Hard navigation clears in-flight apply routes so guards cannot bounce
      // the user back into the form after the session ends.
      if (destination === APPLICANT_SIGN_IN_PATH) {
        window.location.replace(destination)
        return
      }

      await navigate({ to: destination, replace: true })
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <ConfirmAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Log out?"
      tone="destructive"
      headlineLabel="Action"
      headline="Sign out"
      summary="You will need to sign in again to get back to your account."
      notices={[{ icon: 'lock', label: 'Your current session will end on this device.' }]}
      cancelLabel="Cancel"
      confirmLabel={isLeaving ? 'Logging out…' : 'Log out'}
      confirmVariant="destructive"
      loading={isLeaving}
      onConfirm={(event) => {
        event.preventDefault()
        void confirm()
      }}
    />
  )
}

/** Wiring for a menu item that should open the confirmation. */
export function useLogoutDialog() {
  const [open, setOpen] = useState(false)
  return { open, setOpen, requestLogout: () => setOpen(true) }
}
