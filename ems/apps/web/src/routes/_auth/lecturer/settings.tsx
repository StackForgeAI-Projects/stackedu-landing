import { createFileRoute } from '@tanstack/react-router'
import { LecturerShell } from '@/components/LecturerShell'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'

export const Route = createFileRoute('/_auth/lecturer/settings')({
  component: LecturerSettingsPage,
})

function LecturerSettingsPage() {
  return (
    <LecturerShell pageTitle="Account Settings">
      <AccountSettingsView
        breadcrumb="Lecturer"
        notificationPrefs={[
          { key: 'submissions', label: 'Assignment submissions', email: true, sms: false, inapp: true },
          { key: 'atrisk', label: 'At-risk student alerts', email: true, sms: false, inapp: true },
          { key: 'deadlines', label: 'Result submission deadlines', email: true, sms: true, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: false },
        ]}
      />
    </LecturerShell>
  )
}
