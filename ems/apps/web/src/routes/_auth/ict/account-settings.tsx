import { createFileRoute } from '@tanstack/react-router'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'
import { IctShell } from '@/components/IctShell'

export const Route = createFileRoute('/_auth/ict/account-settings')({
  component: IctAccountSettingsPage,
})

function IctAccountSettingsPage() {
  return (
    <IctShell pageTitle="Account Settings">
      <AccountSettingsView
        breadcrumb="ICT Manager"
        notificationPrefs={[
          { key: 'security', label: 'Security alerts', email: true, sms: true, inapp: true },
          { key: 'failedLogins', label: 'Failed login attempts', email: true, sms: false, inapp: true },
          { key: 'integrations', label: 'Integration errors', email: true, sms: false, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: false },
        ]}
      />
    </IctShell>
  )
}
