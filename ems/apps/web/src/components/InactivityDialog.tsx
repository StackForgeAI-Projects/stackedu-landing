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

interface InactivityDialogProps {
  open: boolean
  secondsLeft: number
  onStay: () => void
  onLogout: () => void
}

export function InactivityDialog({ open, secondsLeft, onStay, onLogout }: InactivityDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontFamily: 'var(--font-display)' }}>
            Are you still there?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have been inactive for a few minutes. For your security you will be signed out in{' '}
            <strong>{secondsLeft}s</strong> unless you stay signed in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <AlertDialogCancel onClick={onLogout} className="mt-0 w-full sm:w-auto">
            Log out now
          </AlertDialogCancel>
          <AlertDialogAction onClick={onStay} className="w-full sm:w-auto">
            Stay signed in
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
