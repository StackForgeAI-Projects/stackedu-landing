import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Moon, ShieldCheck, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OtpInput } from '@/components/ui/otp-input'
import {
  accountNotificationPrefsQueryKey,
  accountProfileQueryKey,
  changeAccountPassword,
  disableAccountTwoFactor,
  enableAccountTwoFactor,
  getAccountNotificationPreferences,
  getAccountProfile,
  setupAccountTwoFactor,
  updateAccountNotificationPreferences,
} from '@/lib/api/account'
import { apiErrorMessage } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/notify'
import { applyTheme, getStoredTheme, type ThemeMode } from '@/lib/theme'

export interface NotificationPref {
  key: string
  label: string
  email: boolean
  sms: boolean
  inapp: boolean
}

interface AccountSettingsViewProps {
  breadcrumb: string
  notificationPrefs: NotificationPref[]
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', padding: 28, marginBottom: 24 }}>
      <h2 className="t-h3 mb-5" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
      {children}
    </div>
  )
}


function mergePrefs(defaults: NotificationPref[], stored: NotificationPref[]): NotificationPref[] {
  const byKey = new Map(stored.map((item) => [item.key, item]))
  return defaults.map((item) => {
    const saved = byKey.get(item.key)
    return saved ? { ...item, email: saved.email, sms: saved.sms, inapp: saved.inapp } : item
  })
}

export function AccountSettingsView({ breadcrumb, notificationPrefs }: AccountSettingsViewProps) {
  const { data, isPending, error } = useQuery({ queryKey: accountProfileQueryKey, queryFn: getAccountProfile })

  if (isPending) return <p className="t-body p-8" style={{ color: 'var(--muted-foreground)' }}>Loading settings…</p>
  if (error || !data) {
    return <p className="t-body p-8" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load account settings.')}</p>
  }

  return (
    <div className="animate-fade-up" style={{ padding: '32px 16px 48px', maxWidth: 760, margin: '0 auto' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
        <span>{breadcrumb}</span>
        <span>›</span>
        <span style={{ color: 'var(--foreground)' }}>Account Settings</span>
      </div>
      <h1 className="t-h1 mb-6" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>Account Settings</h1>
      <PasswordCard />
      <ThemeCard />
      <NotificationsCard defaults={notificationPrefs} />
      <TwoFactorCard enabled={data.twoFactorEnabled} email={data.email} institutionName={data.institutionName} />
    </div>
  )
}

function PasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const mutation = useMutation({
    mutationFn: changeAccountPassword,
    onSuccess: () => {
      notifySuccess('Password updated.')
      setCurrent('')
      setNext('')
      setConfirm('')
    },
    onError: (cause) => notifyError(apiErrorMessage(cause, 'Could not update your password.')),
  })

  return (
    <Card title="Change Password">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Current Password</Label>
          <Input type="password" value={current} onChange={(event) => setCurrent(event.target.value)} placeholder="••••••••" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>New Password</Label>
            <Input type="password" value={next} onChange={(event) => setNext(event.target.value)} placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Minimum 8 characters.</p>
        <div>
          <Button
            disabled={mutation.isPending}
            onClick={() => {
              if (!current || !next || !confirm) { notifyError('Please fill in all password fields.'); return }
              if (next.length < 8) { notifyError('New password must be at least 8 characters.'); return }
              if (next !== confirm) { notifyError('New password and confirmation do not match.'); return }
              mutation.mutate({ currentPassword: current, newPassword: next })
            }}
          >
            Update password
          </Button>
        </div>
      </div>
    </Card>
  )
}

function NotificationsCard({ defaults }: { defaults: NotificationPref[] }) {
  const [prefs, setPrefs] = useState(defaults)

  const storedQuery = useQuery({
    queryKey: accountNotificationPrefsQueryKey,
    queryFn: getAccountNotificationPreferences,
  })

  useEffect(() => {
    if (storedQuery.data) {
      setPrefs(mergePrefs(defaults, storedQuery.data.map((item) => ({
        ...item,
        label: defaults.find((d) => d.key === item.key)?.label ?? item.key,
      }))))
    }
  }, [storedQuery.data, defaults])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAccountNotificationPreferences({
        preferences: prefs.map(({ key, email, sms, inapp }) => ({ key, email, sms, inapp })),
      }),
    onSuccess: (saved) => {
      setPrefs(mergePrefs(defaults, saved.map((item) => ({
        ...item,
        label: defaults.find((d) => d.key === item.key)?.label ?? item.key,
      }))))
      notifySuccess('Notification preferences saved.')
    },
    onError: (cause) => notifyError(apiErrorMessage(cause, 'Could not save notification preferences.')),
  })

  function toggle(key: string, channel: 'email' | 'sms' | 'inapp', value: boolean) {
    setPrefs((prev) => prev.map((item) => item.key === key ? { ...item, [channel]: value } : item))
  }

  return (
    <Card title="Notification Preferences">
      <p className="t-body mb-5" style={{ color: 'var(--muted-foreground)' }}>
        Choose how StackEDU may reach you for each type of alert. Email goes to your inbox, SMS goes
        to your phone number on file, and In-app shows messages inside this portal. Turning a channel
        off means we will not use that channel for that alert type.
      </p>
      <div className="flex flex-col gap-4">
        {storedQuery.isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading preferences…</p>
        ) : null}
        {prefs.map((pref) => (
          <div key={pref.key} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm flex-1">{pref.label}</span>
            <div className="flex flex-wrap gap-4">
              {(['email', 'sms', 'inapp'] as const).map((channel) => (
                <div key={channel} className="flex items-center gap-1.5">
                  <Switch checked={pref[channel]} onCheckedChange={(value) => toggle(pref.key, channel, value)} id={`${pref.key}-${channel}`} />
                  <Label htmlFor={`${pref.key}-${channel}`} className="t-label" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                    {channel === 'inapp' ? 'In-app' : channel.toUpperCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Button
          variant="outline"
          disabled={saveMutation.isPending || storedQuery.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save preferences
        </Button>
      </div>
    </Card>
  )
}

function ThemeCard() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme())

  function setTheme(next: ThemeMode) {
    setMode(next)
    applyTheme(next)
    notifySuccess(next === 'dark' ? 'Dark mode is on.' : 'Light mode is on.')
  }

  return (
    <Card title="Appearance">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {mode === 'dark' ? (
            <Moon size={18} style={{ color: 'var(--foreground)', flexShrink: 0 }} />
          ) : (
            <Sun size={18} style={{ color: 'var(--foreground)', flexShrink: 0 }} />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">{mode === 'dark' ? 'Dark mode' : 'Light mode'}</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {mode === 'dark'
                ? 'Switch the toggle to go light mode.'
                : 'Switch the toggle to go dark mode.'}
            </p>
          </div>
        </div>
        <Switch
          checked={mode === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          aria-label="Dark mode"
        />
      </div>
    </Card>
  )
}

function TwoFactorCard({
  enabled,
  email,
  institutionName,
}: {
  enabled: boolean
  email: string
  institutionName: string
}) {
  const queryClient = useQueryClient()
  const [setupOpen, setSetupOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [setupCode, setSetupCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null)

  const setupMutation = useMutation({
    mutationFn: setupAccountTwoFactor,
    onSuccess: (setup) => {
      setSetupData({ secret: setup.secret, qrCodeDataUrl: setup.qrCodeDataUrl })
      setSetupCode('')
      setSetupOpen(true)
    },
    onError: (cause) => notifyError(apiErrorMessage(cause, 'Could not start two-factor setup.')),
  })

  const enableMutation = useMutation({
    mutationFn: () => enableAccountTwoFactor({ code: setupCode, secret: setupData!.secret }),
    onSuccess: async (profile) => {
      queryClient.setQueryData(accountProfileQueryKey, profile)
      setSetupOpen(false)
      setSetupData(null)
      notifySuccess('Two-factor authentication is on.')
    },
    onError: (cause) => notifyError(apiErrorMessage(cause, 'Could not enable two-factor authentication.')),
  })

  const disableMutation = useMutation({
    mutationFn: () => disableAccountTwoFactor({ code: disableCode }),
    onSuccess: async (profile) => {
      queryClient.setQueryData(accountProfileQueryKey, profile)
      setDisableOpen(false)
      setDisableCode('')
      notifySuccess('Two-factor authentication is off.')
    },
    onError: (cause) => notifyError(apiErrorMessage(cause, 'Could not disable two-factor authentication.')),
  })

  return (
    <>
      <Card title="Two-Factor Authentication">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: enabled ? 'var(--success-bg)' : 'var(--muted)' }}>
            <ShieldCheck size={18} style={{ color: enabled ? 'var(--success)' : 'var(--muted-foreground)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Authenticator app at sign-in</p>
            <p className="t-caption mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {enabled
                ? 'After your password, you must enter a 6-digit code from your authenticator app.'
                : 'Add an extra step after your password using Google Authenticator, Authy, 1Password, or any TOTP app.'}
            </p>
          </div>
          {enabled ? (
            <Button variant="outline" onClick={() => setDisableOpen(true)}>Turn off</Button>
          ) : (
            <Button disabled={setupMutation.isPending} onClick={() => setupMutation.mutate()}>
              Set up
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Set up authenticator</DialogTitle>
            <DialogDescription>
              Scan this QR code in your authenticator app for {institutionName}, then enter the
              6-digit code it shows.
            </DialogDescription>
          </DialogHeader>
          {setupData ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <img src={setupData.qrCodeDataUrl} alt="Authenticator QR code" className="rounded-lg border" style={{ borderColor: 'var(--border)' }} />
              <p className="t-caption text-center" style={{ color: 'var(--muted-foreground)' }}>
                Account: {email}
              </p>
              <OtpInput value={setupCode} onChange={setSetupCode} />
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button
              disabled={enableMutation.isPending || setupCode.length < 6 || !setupData}
              onClick={() => enableMutation.mutate()}
            >
              Confirm and enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Turn off two-factor</DialogTitle>
            <DialogDescription>
              Enter a current code from your authenticator app to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <OtpInput value={disableCode} onChange={setDisableCode} />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDisableOpen(false)}>Cancel</Button>
            <Button
              disabled={disableMutation.isPending || disableCode.length < 6}
              onClick={() => disableMutation.mutate()}
              style={{ backgroundColor: 'var(--error)', color: '#fff' }}
            >
              Turn off 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
