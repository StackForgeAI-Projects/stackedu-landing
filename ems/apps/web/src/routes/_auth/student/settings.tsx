import { createFileRoute } from '@tanstack/react-router'
import { AccountSettingsView } from '@/components/account/AccountSettingsView'
import { StudentShell } from '@/components/StudentShell'

export const Route = createFileRoute('/_auth/student/settings')({
  component: StudentSettingsPage,
})

function StudentSettingsPage() {
  return (
    <StudentShell pageTitle="Account Settings">
      <AccountSettingsView
        breadcrumb="Student"
        notificationPrefs={[
          { key: 'results', label: 'Result publications', email: true, sms: true, inapp: true },
          { key: 'fees', label: 'Fee payment reminders', email: true, sms: true, inapp: true },
          { key: 'registration', label: 'Course registration windows', email: true, sms: false, inapp: true },
          { key: 'assignments', label: 'Assignment deadlines & feedback', email: false, sms: false, inapp: true },
        ]}
      />
    </StudentShell>
  )
}
