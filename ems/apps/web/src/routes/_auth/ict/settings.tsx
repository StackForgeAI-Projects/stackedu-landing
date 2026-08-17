import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { IctShell } from '@/components/IctShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getIctSettings, ictProfileQueryKey, ictSettingsQueryKey, updateIctSettings } from '@/lib/api/ict'
import { institutionBrandingQueryKey } from '@/hooks/useInstitutionBranding'
import { accountProfileQueryKey } from '@/lib/api/account'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/ict/settings')({
  component: SystemSettingsPage,
})

function SystemSettingsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: ictSettingsQueryKey, queryFn: getIctSettings })
  const [form, setForm] = useState({ name: '', shortName: '', contactEmail: '', timezone: '', locale: 'en' as 'en' | 'fr' | 'rw' })

  useEffect(() => {
    if (data) setForm({ name: data.name, shortName: data.shortName, contactEmail: data.contactEmail, timezone: data.timezone, locale: data.locale })
  }, [data])

  const mutation = useMutation({
    mutationFn: () => updateIctSettings(form),
    onSuccess: async () => {
      toast.success('Institution settings saved.')
      await queryClient.invalidateQueries({ queryKey: ictSettingsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ictProfileQueryKey })
      await queryClient.invalidateQueries({ queryKey: institutionBrandingQueryKey })
      await queryClient.invalidateQueries({ queryKey: accountProfileQueryKey })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save settings.')),
  })

  return (
    <IctShell
      pageTitle="Settings"
      guide="Change the institution name, contact email, timezone and language. Faculties, programmes and semester activation are Academic Admin screens, not settings."
    >
      <div className="animate-fade-up mx-auto w-full max-w-[760px]" style={{ padding: '32px 0 48px' }}>
        <h1 className="t-h1 mb-5" style={{ fontFamily: 'var(--font-display)' }}>Institution settings</h1>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading settings…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load settings.')}</p>
        ) : (
          <form
            className="flex flex-col gap-4 p-5"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}
            onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}
          >
            <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>The institution short code cannot be changed here.</p>
            <div>
              <Label htmlFor="name">Institution name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="short">Short name</Label>
              <Input id="short" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Contact email</Label>
              <Input id="email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </div>
            <div>
              <Label>Locale</Label>
              <select className="w-full text-sm px-3 py-2 rounded-lg" style={{ border: '1px solid var(--border)' }} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as 'en' | 'fr' | 'rw' })}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>
            <Button type="submit" disabled={mutation.isPending}>Save settings</Button>
          </form>
        )}
      </div>
    </IctShell>
  )
}
