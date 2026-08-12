import { toast } from 'sonner'

/**
 * App-wide feedback.
 *
 * Every screen that needs to tell the user something goes through here, so the
 * look, the five-second timeout and the close button stay the same everywhere.
 * The Toaster itself is mounted once in the root route.
 */

export function notifySuccess(message: string): void {
  toast.success(message)
}

export function notifyError(message: string): void {
  toast.error(message)
}

export function notifyInfo(message: string): void {
  toast.message(message)
}
