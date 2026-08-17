import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OtpInput } from '@/components/ui/otp-input'
import { verifyTwoFactor, sessionQueryKey } from '@/lib/api/auth'
import { apiErrorMessage } from '@/lib/api/client'
import { dashboardFor } from '@/lib/auth/portals'
import { notifyError } from '@/lib/notify'
import { rememberWelcome } from '@/lib/welcome'
import { queryClient } from '@/lib/query-client'

export const Route = createFileRoute('/verify')({
  component: VerifyPage,
})

function VerifyPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) return
    setIsLoading(true)
    try {
      const user = await verifyTwoFactor(otp)
      queryClient.setQueryData(sessionQueryKey, user)
      rememberWelcome(user.fullName)
      await navigate({ to: dashboardFor(user.role) })
    } catch (cause) {
      notifyError(apiErrorMessage(cause, 'That code is not correct. Try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl p-8 sm:p-10 animate-fade-up"
        style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow-xl)' }}
      >
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <ShieldCheck className="h-6 w-6" strokeWidth={1.5} style={{ color: 'var(--brand)' }} />
        </div>

        <h1 className="t-h1 mb-2" style={{ color: 'var(--foreground)' }}>
          Two-factor check
        </h1>
        <p className="t-body mb-8" style={{ color: 'var(--muted-foreground)' }}>
          Open your authenticator app (Google Authenticator, Authy, 1Password, or similar) and enter
          the 6-digit code for StackEDU.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <OtpInput value={otp} onChange={setOtp} disabled={isLoading} autoFocus />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold text-sm"
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? 'Verifying…' : 'Verify and continue'}
          </Button>
        </form>

        <div className="my-6 h-px" style={{ backgroundColor: 'var(--border)' }} />

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted-foreground)' }}
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
