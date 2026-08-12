import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { logout } from '@/lib/api/auth'
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
  const [isLeaving, setIsLeaving] = useState(false)

  const confirm = async () => {
    setIsLeaving(true)
    await logout().catch(() => undefined)
    queryClient.clear()
    await navigate({ to: redirectTo })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            Log out?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You will need to sign in again to get back to your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <AlertDialogCancel disabled={isLeaving} className="mt-0 w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog up while the request is in flight, so the
              // button can show progress instead of vanishing.
              event.preventDefault()
              void confirm()
            }}
            disabled={isLeaving}
            className="w-full sm:w-auto"
            style={{ backgroundColor: 'var(--error)', color: '#FFFFFF' }}
          >
            {isLeaving ? 'Logging out…' : 'Log out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Wiring for a menu item that should open the confirmation. */
export function useLogoutDialog() {
  const [open, setOpen] = useState(false)
  return { open, setOpen, requestLogout: () => setOpen(true) }
}
