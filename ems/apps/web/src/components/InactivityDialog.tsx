import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog'

interface InactivityDialogProps {
  open: boolean
  secondsLeft: number
  onStay: () => void
  onLogout: () => void
}

export function InactivityDialog({ open, secondsLeft, onStay, onLogout }: InactivityDialogProps) {
  return (
    <ConfirmAlertDialog
      open={open}
      title="Are you still there?"
      tone="warning"
      headlineLabel="Security check"
      headline="Session ending soon"
      summary={`You have been inactive for a few minutes. For your security you will be signed out in ${secondsLeft}s unless you stay signed in.`}
      notices={[
        { icon: 'shield', label: 'Stay signed in to keep working without interruption.' },
        { icon: 'lock', label: 'Choose log out now if you are finished on this device.' },
      ]}
      cancelLabel="Log out now"
      confirmLabel="Stay signed in"
      onCancel={onLogout}
      onConfirm={onStay}
    />
  )
}
