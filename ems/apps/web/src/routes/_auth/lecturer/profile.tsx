import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Building2, IdCard } from 'lucide-react'
import { LecturerShell } from '@/components/LecturerShell'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { getLecturerProfile, lecturerProfileQueryKey } from '@/lib/api/lecturer'

export const Route = createFileRoute('/_auth/lecturer/profile')({
  component: LecturerProfilePage,
})

function LecturerProfilePage() {
  const { data } = useQuery({ queryKey: lecturerProfileQueryKey, queryFn: getLecturerProfile })
  return (
    <LecturerShell pageTitle="My Profile">
      <AccountProfileView
        breadcrumb="Lecturer"
        subtitle={data ? `Lecturer · ${data.department}` : 'Lecturer'}
        extraFields={[
          { icon: IdCard, label: 'Staff ID', value: data?.staffId ?? '—', mono: true },
          { icon: Building2, label: 'Department', value: data?.department ?? '—' },
        ]}
      />
    </LecturerShell>
  )
}
