import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { createElement } from 'react'

/**
 * App-wide feedback.
 *
 * Every screen that needs to tell the user something goes through here, so the
 * look, the five-second timeout and the close button stay the same everywhere.
 * The Toaster itself is mounted once in the root route.
 */

const TOAST_CLASS_NAMES = {
  toast: 'rounded-xl border shadow-sm',
  title: 'text-sm font-semibold',
  description: 'text-sm leading-relaxed',
}

export function notifySuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
    icon: createElement(CheckCircle2, { className: 'h-4 w-4', style: { color: 'var(--success)' } }),
    classNames: TOAST_CLASS_NAMES,
  })
}

export function notifyError(message: string, description?: string): void {
  toast.error(message, {
    description,
    icon: createElement(AlertCircle, { className: 'h-4 w-4', style: { color: 'var(--error)' } }),
    classNames: TOAST_CLASS_NAMES,
  })
}

export function notifyInfo(message: string, description?: string): void {
  toast.message(message, {
    description,
    icon: createElement(Info, { className: 'h-4 w-4', style: { color: 'var(--info)' } }),
    classNames: TOAST_CLASS_NAMES,
  })
}
