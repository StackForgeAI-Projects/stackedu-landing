import { createFileRoute } from '@tanstack/react-router'
import { Building2, IdCard } from 'lucide-react'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { LibrarianShell } from '@/components/LibrarianShell'
import { LIBRARIAN } from '@/data/librarian'

export const Route = createFileRoute('/_auth/librarian/profile')({
  component: LibrarianProfilePage,
})

function LibrarianProfilePage() {
  return (
    <LibrarianShell pageTitle="My Profile">
      <AccountProfileView
        breadcrumb="Librarian"
        subtitle={`Librarian · ${LIBRARIAN.office}`}
        extraFields={[
          { icon: IdCard, label: 'Staff ID', value: LIBRARIAN.employeeId, mono: true },
          { icon: Building2, label: 'Office', value: LIBRARIAN.office },
        ]}
      />
    </LibrarianShell>
  )
}
