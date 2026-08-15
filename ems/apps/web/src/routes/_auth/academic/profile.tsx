import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { AcademicShell } from '@/components/AcademicShell'
import { AccountProfileView } from '@/components/account/AccountProfileView'
import { accountProfileQueryKey, getAccountProfile } from '@/lib/api/account'

export const Route = createFileRoute('/_auth/academic/profile')({
  component: AcademicProfilePage,
})

function AcademicProfilePage() {
  const { data } = useQuery({ queryKey: accountProfileQueryKey, queryFn: getAccountProfile })

  return (
    <AcademicShell pageTitle="My Profile">
      <AccountProfileView
        breadcrumb="Academic Admin"
        subtitle={`Academic Admin · ${data?.institutionName ?? 'Institution'}`}
        extraFields={[
          { icon: Building2, label: 'Institution', value: data?.institutionName ?? '—' },
        ]}
      />
    </AcademicShell>
  )
}
