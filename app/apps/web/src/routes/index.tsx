import { createFileRoute } from '@tanstack/react-router'
import { LoginScreen } from '@/components/LoginScreen'
import { redirectSignedInToDashboard } from '@/lib/auth/guards'

// The landing page is the sign-in screen; anyone already signed in goes
// straight to their role's dashboard instead.
export const Route = createFileRoute('/')({
  beforeLoad: redirectSignedInToDashboard,
  component: LoginScreen,
})
