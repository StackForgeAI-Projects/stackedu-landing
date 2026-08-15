import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'
import { LECTURER, LECTURER_NAV } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/settings')({
  component: LecturerSettingsPage,
})

function LecturerSettingsPage() {
  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="Account Settings"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <AccountSettingsView
        breadcrumb="Lecturer"
        notificationPrefs={[
          { key: 'submissions', label: 'Assignment submissions', email: true, sms: false, inapp: true },
          { key: 'atrisk', label: 'At-risk student alerts', email: true, sms: false, inapp: true },
          { key: 'deadlines', label: 'Result submission deadlines', email: true, sms: true, inapp: true },
          { key: 'system', label: 'System announcements', email: true, sms: false, inapp: false },
        ]}
      />
    </AppShell>
  )
}
