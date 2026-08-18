import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ApplicantEmailVerification } from '@/components/apply/ApplicantEmailVerification'
import { ApplyTopBar } from '@/components/ApplyLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { redirectApplicantHome } from '@/lib/auth/guards'

export const Route = createFileRoute('/apply/verify')({
  beforeLoad: redirectApplicantHome,
  component: ApplyVerifyPage,
})

function ApplyVerifyPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const ready = email.trim().length > 0 && password.length > 0

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <ApplyTopBar progressPercent={0} />

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div
          className="w-full max-w-[520px] animate-fade-up"
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            padding: '1.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <div className="mb-6 flex flex-col gap-4">
            <div>
              <Label htmlFor="verify-email">Email address</Label>
              <Input
                id="verify-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="verify-password">Password</Label>
              <Input
                id="verify-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div>
              <Label htmlFor="verify-name">Full name (optional)</Label>
              <Input
                id="verify-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Used in the greeting"
              />
            </div>
          </div>

          {ready ? (
            <ApplicantEmailVerification
              email={email.trim()}
              fullName={fullName.trim() || email.trim()}
              password={password}
              onVerified={async () => {
                await navigate({ to: '/apply/form', search: { step: undefined } })
              }}
            />
          ) : (
            <p className="t-body text-center" style={{ color: 'var(--muted-foreground)' }}>
              Enter your email and password to verify your account.
            </p>
          )}

          <div className="my-6" style={{ height: 1, backgroundColor: 'var(--border)' }} />

          <div className="text-center">
            <Link
              to="/apply"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}
            >
              ← Back to create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
