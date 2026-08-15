import { createFileRoute } from '@tanstack/react-router'
import { AcademicShell } from '@/components/AcademicShell'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'

export const Route = createFileRoute('/_auth/academic/settings')({
  component: AcademicSettingsPage,
})

function AcademicSettingsPage() {
  return (
    <AcademicShell pageTitle="Account Settings">
      <AccountSettingsView
        breadcrumb="Academic Admin"
        notificationPrefs={[
          { key: 'applications', label: 'New applications', email: true, sms: false, inapp: true },
          { key: 'results', label: 'Results ready to publish', email: true, sms: false, inapp: true },
          { key: 'atrisk', label: 'At-risk student alerts', email: true, sms: true, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: false },
        ]}
      />
    </AcademicShell>
  )
}
