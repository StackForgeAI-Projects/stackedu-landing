import { createFileRoute } from '@tanstack/react-router'
import { Building2, IdCard } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { LECTURER, LECTURER_NAV } from '@/data/lecturer'

export const Route = createFileRoute('/_auth/lecturer/profile')({
  component: LecturerProfilePage,
})

function LecturerProfilePage() {
  return (
    <AppShell
      navItems={LECTURER_NAV}
      pageTitle="My Profile"
      userName={LECTURER.fullName}
      userRole="Lecturer"
      userInitials={LECTURER.initials}
      infoCardLabel="LECTURER ID"
      infoCardValue={LECTURER.id}
      infoCardSubtext={LECTURER.department}
    >
      <AccountProfileView
        breadcrumb="Lecturer"
        subtitle={`Lecturer · ${LECTURER.department}`}
        extraFields={[
          { icon: IdCard, label: 'Staff ID', value: LECTURER.id, mono: true },
          { icon: Building2, label: 'Department', value: LECTURER.department },
        ]}
      />
    </AppShell>
  )
}
