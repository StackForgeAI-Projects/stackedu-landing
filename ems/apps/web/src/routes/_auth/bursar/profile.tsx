import { createFileRoute } from '@tanstack/react-router'
import { Building2, IdCard } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { BURSAR, BURSAR_NAV } from '@/data/bursar'

export const Route = createFileRoute('/_auth/bursar/profile')({
  component: BursarProfilePage,
})

function BursarProfilePage() {
  return (
    <AppShell
      navItems={BURSAR_NAV}
      pageTitle="My Profile"
      userName={BURSAR.fullName}
      userRole="Bursar"
      userInitials={BURSAR.initials}
      infoCardLabel="BURSAR"
      infoCardValue={BURSAR.institution}
      infoCardSubtext={BURSAR.office}
    >
      <AccountProfileView
        breadcrumb="Bursar"
        subtitle={`Bursar · ${BURSAR.office}`}
        extraFields={[
          { icon: IdCard, label: 'Staff ID', value: BURSAR.id, mono: true },
          { icon: Building2, label: 'Office', value: BURSAR.office },
        ]}
      />
    </AppShell>
  )
}
