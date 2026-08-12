import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { BrandMark } from '@/components/BrandMark'
import { AuthHero, INSTITUTION_NAME, SIGN_IN_FEATURES } from '@/components/AuthHero'
import { login, sessionQueryKey } from '@/lib/api/auth'
import { apiErrorMessage } from '@/lib/api/client'
import { dashboardFor } from '@/lib/auth/portals'
import { notifyError } from '@/lib/notify'
import { queryClient } from '@/lib/query-client'

export function LoginScreen() {
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * The account type is never chosen here. The server identifies the user from
   * the credentials, and the role it returns decides where they land.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await login({ identifier, password, rememberMe })
      queryClient.setQueryData(sessionQueryKey, user)
      await navigate({ to: dashboardFor(user.role) })
    } catch (cause) {
      notifyError(apiErrorMessage(cause, 'We could not sign you in. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      <AuthHero
        title="Welcome back"
        subtitle={`Sign in to ${INSTITUTION_NAME}`}
        features={SIGN_IN_FEATURES}
      />

      {/* ── Right panel — sign-in form ────────────────────────────────────── */}
      <div
        className="flex lg:w-[58%] flex-1 flex-col p-8 sm:p-12"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Mobile-only mark — on desktop the hero panel carries it instead. */}
        <div className="mb-10 lg:hidden">
          <BrandMark
            size={32}
            wordmarkColor="var(--foreground)"
            wordmarkClassName="text-base font-bold tracking-tight"
          />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px] animate-fade-up">

            <div className="mb-8">
              {/* The hero panel names the institution on desktop. */}
              <p
                className="text-sm font-medium mb-1 lg:hidden"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {INSTITUTION_NAME}
              </p>
              <h1
                className="t-h1 mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                Sign in
              </h1>
              <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>
                Use your email, student number or application ID.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="identifier">Email or ID number</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@email.com or SFU-2026-0001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + forgot password */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v as boolean)}
                  />
                  <Label
                    htmlFor="remember"
                    className="font-normal text-sm"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--success)' }}
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm transition-transform duration-150 hover:-translate-y-px active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Prospective students */}
            <div
              className="mt-8 pt-6 text-center"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                New student?{' '}
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-1 font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--success)' }}
                >
                  Apply here
                  <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center"
          style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}
        >
          Powered by{' '}
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
            StackForgeAI
          </span>
        </p>
      </div>
    </div>
  )
}
