import { createFileRoute } from '@tanstack/react-router'
import { LoginScreen } from '@/components/LoginScreen'
import { redirectSignedInToDashboard } from '@/lib/auth/guards'

// Kept alongside the landing page because expired sessions and the
// password-reset flow send people to /login by name.
export const Route = createFileRoute('/login')({
  beforeLoad: redirectSignedInToDashboard,
  component: LoginScreen,
})
