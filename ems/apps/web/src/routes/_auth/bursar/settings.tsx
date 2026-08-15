import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'
import { BURSAR, BURSAR_NAV } from '@/data/bursar'

export const Route = createFileRoute('/_auth/bursar/settings')({
  component: BursarSettingsPage,
})

function BursarSettingsPage() {
  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="Account Settings"
      userName={BURSAR.fullName}
      userRole="Bursar"
      userInitials={BURSAR.initials}
      infoCardLabel="BURSAR"
      infoCardValue={BURSAR.institution}
      infoCardSubtext={BURSAR.office}
    >
      <AccountSettingsView
        breadcrumb="Bursar"
        notificationPrefs={[
          { key: 'payments', label: 'Payment notifications', email: true, sms: false, inapp: true },
          { key: 'holds', label: 'Fee hold changes', email: true, sms: false, inapp: true },
          { key: 'reconciliation', label: 'Reconciliation mismatches', email: true, sms: true, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: false },
        ]}
      />
    </AppShell>
  )
}
